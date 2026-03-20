const Organization = require('./organization.schema');
const Role = require('../role/role.schema');
const { AppError } = require('../../middlewares/error.middleware');
const User = require('../user/user.schema');
const usageService = require('../usage/usage.service');
const { getPlan, isUnlimited } = require('../../utils/planConfig');

const createOrganization = async ({ name, slug, logoUrl }, userId) => {
  const existing = await Organization.findOne({ slug });
  if (existing) throw new AppError('Organization slug already in use', 409);

  const org = await Organization.create({ name, slug, logoUrl });

  // Grant the creator admin role
  await Role.create({ userId, organizationId: org._id, role: 'admin' });

  // Set the user's current organization
  await User.findByIdAndUpdate(userId, { organizationId: org._id, role: 'admin' });

  return org;
};

const getOrganizationsForUser = async (userId) => {
  const roles = await Role.find({ userId }).populate('organizationId');
  return roles.map((r) => ({ ...r.organizationId.toObject(), role: r.role }));
};

const getOrganizationById = async (orgId, userId) => {
  const role = await Role.findOne({ userId, organizationId: orgId });
  if (!role) {
    // Fallback: allow if user's own organizationId matches
    const user = await User.findById(userId);
    if (!user || String(user.organizationId) !== String(orgId)) {
      throw new AppError('Not authorized to access this organization', 403);
    }
  }
  const org = await Organization.findById(orgId);
  if (!org) throw new AppError('Organization not found', 404);
  return org;
};

const updateOrganization = async (orgId, userId, data) => {
  const role = await Role.findOne({ userId, organizationId: orgId });
  if (!role) {
    // Fallback: allow if user's own organizationId matches
    const user = await User.findById(userId);
    if (!user || String(user.organizationId) !== String(orgId)) {
      throw new AppError('Not authorized', 403);
    }
  }
  const org = await Organization.findByIdAndUpdate(orgId, data, { new: true, runValidators: true });
  if (!org) throw new AppError('Organization not found', 404);
  return org;
};

const deleteOrganization = async (orgId, userId) => {
  const role = await Role.findOne({ userId, organizationId: orgId });
  if (!role || role.role !== 'admin') throw new AppError('Not authorized', 403);
  const org = await Organization.findByIdAndDelete(orgId);
  if (!org) throw new AppError('Organization not found', 404);
  await Role.deleteMany({ organizationId: orgId });
  return { message: 'Organization deleted' };
};

const getUsage = async (orgId, userId) => {
  let org = await getOrganizationById(orgId, userId);
  const planConfig = getPlan(org.plan);

  // Ensure billing cycle dates are persisted (handles orgs created before plan fields existed)
  const raw = await Organization.findById(orgId).lean();
  if (!raw.billingCycleStart || !raw.billingCycleEnd) {
    const now = new Date();
    const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    org = await Organization.findByIdAndUpdate(
      orgId,
      { $set: { billingCycleStart: now, billingCycleEnd: end } },
      { new: true }
    );
  }

  const now = new Date();
  const cycleExpired = org.billingCycleEnd && new Date(org.billingCycleEnd) < now;

  let usage;
  if (cycleExpired) {
    // Billing cycle has ended — treat usage as 0 for the new implicit cycle
    usage = { certificates_created: 0, templates_created: 0 };
  } else {
    usage = await usageService.getUsageForOrg(
      org._id,
      org.billingCycleStart,
      org.billingCycleEnd
    );
  }

  return {
    plan_name: planConfig.name,
    plan_id: org.plan,
    price_monthly: planConfig.price,
    billing_cycle_start: org.billingCycleStart.toISOString(),
    billing_cycle_end: org.billingCycleEnd.toISOString(),
    limits: {
      certificates_created: planConfig.limits.certificates_created,
      templates_created: planConfig.limits.templates_created,
      ...planConfig.features,
    },
    usage: {
      certificates_created: usage.certificates_created,
      templates_created: usage.templates_created,
    },
  };
};

const incrementUsage = async (orgId, userId, metric, amount = 1) => {
  const org = await getOrganizationById(orgId, userId);
  return usageService.incrementUsage(
    org._id,
    metric,
    org.billingCycleStart,
    org.billingCycleEnd,
    amount
  );
};

/**
 * Ensure an org has persisted billing cycle dates.
 * Returns the org document (lean) with guaranteed billingCycleStart/End.
 */
const ensureBillingCycle = async (orgId) => {
  let org = await Organization.findById(orgId).lean();
  if (!org) return null;
  if (!org.billingCycleStart || !org.billingCycleEnd) {
    const now = new Date();
    const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    org = await Organization.findByIdAndUpdate(
      orgId,
      { $set: { billingCycleStart: now, billingCycleEnd: end } },
      { new: true }
    ).lean();
  }
  return org;
};

module.exports = {
  createOrganization,
  getOrganizationsForUser,
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
  getUsage,
  incrementUsage,
  ensureBillingCycle,
};
