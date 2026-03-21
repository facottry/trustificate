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
  // Validate slug uniqueness if slug is being changed
  if (data.slug) {
    const slugLower = data.slug.toLowerCase().trim();
    if (!/^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$/.test(slugLower)) {
      throw new AppError('Slug must be 3–60 characters, lowercase alphanumeric and hyphens only, no leading/trailing hyphens', 422);
    }
    const existing = await Organization.findOne({ slug: slugLower, _id: { $ne: orgId } });
    if (existing) throw new AppError('Organization slug already in use', 409);
    data.slug = slugLower;
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
  const Certificate = require('../certificate/certificate.schema');
  const Template = require('../template/template.schema');

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
    usage = { certificates_created: 0, templates_created: 0 };
  } else {
    usage = await usageService.getUsageForOrg(
      org._id,
      org.billingCycleStart,
      org.billingCycleEnd
    );

    // Backfill: if usage counters are 0, count actual documents in DB
    // (covers certs/templates created before usage tracking was introduced)
    if (usage.certificates_created === 0) {
      // Try within billing cycle first, then fall back to all-time
      let actualCerts = await Certificate.countDocuments({
        organizationId: org._id,
        status: { $ne: 'draft' },
        createdAt: { $gte: org.billingCycleStart, $lte: org.billingCycleEnd },
      });
      if (actualCerts === 0) {
        actualCerts = await Certificate.countDocuments({
          organizationId: org._id,
          status: { $ne: 'draft' },
        });
      }
      if (actualCerts > 0) {
        await usageService.incrementUsage(
          org._id, 'certificates_created',
          org.billingCycleStart, org.billingCycleEnd,
          actualCerts
        );
        usage.certificates_created = actualCerts;
      }
    }

    if (usage.templates_created === 0) {
      let actualTemplates = await Template.countDocuments({
        organizationId: org._id,
        createdAt: { $gte: org.billingCycleStart, $lte: org.billingCycleEnd },
      });
      if (actualTemplates === 0) {
        actualTemplates = await Template.countDocuments({ organizationId: org._id });
      }
      if (actualTemplates > 0) {
        await usageService.incrementUsage(
          org._id, 'templates_created',
          org.billingCycleStart, org.billingCycleEnd,
          actualTemplates
        );
        usage.templates_created = actualTemplates;
      }
    }
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

const getTeamMembers = async (orgId) => {
  const roles = await Role.find({ organizationId: orgId }).populate('userId', 'displayName email');
  return roles.map((r) => ({
    userId: r.userId?._id,
    displayName: r.userId?.displayName,
    email: r.userId?.email,
    role: r.role,
    createdAt: r.createdAt,
  }));
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
  getTeamMembers,
};
