const Organization = require('./organization.schema');
const Role = require('../role/role.schema');
const { AppError } = require('../../middlewares/error.middleware');

const User = require('../user/user.schema');

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
  if (!role) throw new AppError('Not authorized to access this organization', 403);
  const org = await Organization.findById(orgId);
  if (!org) throw new AppError('Organization not found', 404);
  return org;
};

const updateOrganization = async (orgId, userId, data) => {
  const role = await Role.findOne({ userId, organizationId: orgId });
  if (!role || role.role !== 'admin') throw new AppError('Not authorized', 403);
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
  await getOrganizationById(orgId, userId);

  // Placeholder usage/limits. Replace with real plan logic as needed.
  return {
    plan_name: 'starter',
    plan_id: 'starter',
    price_monthly: 0,
    billing_cycle_start: new Date().toISOString(),
    billing_cycle_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    limits: {
      certificates_created: 999999,
      templates_created: 999999,
      team_members: 999999,
      bulk_import: true,
      api_access: true,
      webhook_access: true,
      analytics_access: true,
      audit_exports: true,
      priority_support: true,
    },
    usage: {
      certificates_created: 0,
      templates_created: 0,
      team_members: 0,
    },
  };
};

const incrementUsage = async (orgId, userId, metric, amount = 1) => {
  await getOrganizationById(orgId, userId);
  // Placeholder: no-op. Real implementation should persist usage in the database.
  return { success: true };
};

module.exports = {
  createOrganization,
  getOrganizationsForUser,
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
  getUsage,
  incrementUsage,
};
