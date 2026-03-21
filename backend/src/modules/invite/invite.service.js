const crypto = require('crypto');
const Invite = require('./invite.schema');
const Role = require('../role/role.schema');
const User = require('../user/user.schema');
const Organization = require('../organization/organization.schema');
const usageService = require('../usage/usage.service');
const { ensureBillingCycle } = require('../organization/organization.service');
const { getPlan, isUnlimited } = require('../../utils/planConfig');
const { AppError } = require('../../middlewares/error.middleware');
const { sendTransactional } = require('../../services/emailService');

/**
 * Verify the org is on the enterprise plan.
 */
const requireEnterprisePlan = (org) => {
  if (org.plan !== 'enterprise') {
    throw new AppError('Team invites are available on the Enterprise plan only', 403);
  }
};

/**
 * Check team_members usage against plan limit.
 */
const checkTeamMembersLimit = async (org) => {
  const planConfig = getPlan(org.plan);
  const limit = planConfig.limits.team_members;
  if (isUnlimited(limit)) return;

  const now = new Date();
  const usage = now > org.billingCycleEnd
    ? 0
    : await usageService.getUsageForMetric(org._id, 'team_members', org.billingCycleStart, org.billingCycleEnd);

  if (usage >= limit) {
    throw new AppError(
      `Plan limit reached: you have used ${usage}/${limit} team members this billing cycle. Upgrade your plan to continue.`,
      403
    );
  }
};

/**
 * Create and send a team invite.
 */
const createInvite = async (email, organizationId, invitedBy, role = 'user') => {
  const org = await ensureBillingCycle(organizationId);
  if (!org) throw new AppError('Organization not found', 404);

  requireEnterprisePlan(org);
  await checkTeamMembersLimit(org);

  const normalizedEmail = email.toLowerCase().trim();

  // Check if user is already a member
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    const existingRole = await Role.findOne({ userId: existingUser._id, organizationId });
    if (existingRole) {
      throw new AppError('This user is already a member of the organization', 409);
    }
  }

  // Check for duplicate pending invite
  const existingInvite = await Invite.findOne({ email: normalizedEmail, organizationId, status: 'pending' });
  if (existingInvite) {
    throw new AppError('An invite is already pending for this email', 409);
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invite = await Invite.create({
    email: normalizedEmail,
    organizationId,
    invitedBy,
    role,
    token,
    expiresAt,
  });

  // Fetch inviter name for email
  const inviter = await User.findById(invitedBy).select('displayName');
  const inviterName = inviter?.displayName || 'A team member';
  const joinLink = `${process.env.FRONTEND_URL || 'https://trustificate.clicktory.in'}/accept-invite?token=${token}`;

  // Send invite email (non-blocking — don't fail invite creation if email fails)
  sendTransactional(normalizedEmail, 'team-invite', { orgName: org.name, inviterName, joinLink }, "You've Been Invited").catch(() => {});

  return invite;
};

/**
 * Accept an invite by token. The user must be authenticated.
 */
const acceptInvite = async (token, userId) => {
  const invite = await Invite.findOne({ token }).populate('organizationId');
  if (!invite) throw new AppError('Invite not found', 404);

  // Handle expired
  if (invite.status === 'pending' && new Date() > invite.expiresAt) {
    await Invite.findByIdAndUpdate(invite._id, { status: 'expired' });
    throw new AppError('This invite has expired', 410);
  }

  if (invite.status !== 'pending') {
    if (invite.status === 'expired') throw new AppError('This invite has expired', 410);
    if (invite.status === 'revoked') throw new AppError('This invite has been revoked', 400);
    if (invite.status === 'accepted') throw new AppError('This invite has already been accepted', 400);
    throw new AppError('Invalid invite', 400);
  }

  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);

  // Check if user already belongs to another org
  if (user.organizationId && String(user.organizationId) !== String(invite.organizationId._id)) {
    throw new AppError('User already belongs to another organization', 409);
  }

  const orgId = invite.organizationId._id;

  // Create role record (upsert to handle edge case)
  await Role.findOneAndUpdate(
    { userId, organizationId: orgId },
    { userId, organizationId: orgId, role: invite.role },
    { upsert: true, new: true }
  );

  // Update user's organizationId
  await User.findByIdAndUpdate(userId, { organizationId: orgId, role: invite.role });

  // Mark invite accepted
  await Invite.findByIdAndUpdate(invite._id, { status: 'accepted' });

  // Increment team_members usage
  const org = await ensureBillingCycle(orgId);
  if (org) {
    await usageService.incrementUsage(orgId, 'team_members', org.billingCycleStart, org.billingCycleEnd, 1);
  }

  return { invite, organizationId: orgId };
};

/**
 * Get invite details by token (public — for the accept-invite page).
 */
const getInviteByToken = async (token) => {
  const invite = await Invite.findOne({ token })
    .populate('organizationId', 'name slug logoUrl')
    .populate('invitedBy', 'displayName email');
  if (!invite) throw new AppError('Invite not found', 404);
  return invite;
};

/**
 * List all invites for an organization, sorted newest first.
 */
const listInvitesForOrg = async (organizationId) => {
  return Invite.find({ organizationId })
    .sort({ createdAt: -1 })
    .populate('invitedBy', 'displayName email');
};

/**
 * Revoke a pending invite.
 */
const revokeInvite = async (inviteId, organizationId) => {
  const invite = await Invite.findOne({ _id: inviteId, organizationId });
  if (!invite) throw new AppError('Invite not found', 404);
  if (invite.status !== 'pending') {
    throw new AppError(`Cannot revoke an invite with status '${invite.status}'`, 400);
  }
  return Invite.findByIdAndUpdate(inviteId, { status: 'revoked' }, { new: true });
};

module.exports = {
  createInvite,
  acceptInvite,
  getInviteByToken,
  listInvitesForOrg,
  revokeInvite,
};
