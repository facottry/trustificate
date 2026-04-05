const User = require('../user/user.schema');
const Organization = require('../organization/organization.schema');
const Certificate = require('../certificate/certificate.schema');
const Template = require('../template/template.schema');
const Order = require('../order/order.schema');
const Coupon = require('../coupon/coupon.schema');
const Event = require('../event/event.schema');
const { AppError } = require('../../middlewares/error.middleware');

// ── Super-admin: platform stats ──────────────────────────────────────
const getSuperStats = async () => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalUsers,
    totalOrgs,
    totalCerts,
    activeCerts,
    revokedCerts,
    totalTemplates,
    certsThisMonth,
    orders,
    planDist,
  ] = await Promise.all([
    User.countDocuments(),
    Organization.countDocuments(),
    Certificate.countDocuments(),
    Certificate.countDocuments({ status: 'issued' }),
    Certificate.countDocuments({ status: 'revoked' }),
    Template.countDocuments(),
    Certificate.countDocuments({ createdAt: { $gte: monthStart } }),
    Order.find({ status: 'completed' }).select('finalAmount'),
    Organization.aggregate([{ $group: { _id: '$plan', count: { $sum: 1 } } }]),
  ]);

  const totalRevenue = orders.reduce((s, o) => s + (o.finalAmount || 0), 0);
  const paidOrgs = planDist.filter((p) => p._id !== 'free').reduce((s, p) => s + p.count, 0);
  const freeOrgs = planDist.find((p) => p._id === 'free')?.count || 0;

  return {
    total_users: totalUsers,
    total_organizations: totalOrgs,
    total_certificates: totalCerts,
    active_certificates: activeCerts,
    revoked_certificates: revokedCerts,
    total_templates: totalTemplates,
    certs_this_month: certsThisMonth,
    total_revenue: totalRevenue,
    mrr: 0, // no recurring billing yet
    active_subscriptions: paidOrgs,
    free_orgs: freeOrgs,
    paid_orgs: paidOrgs,
    total_verifications: 0,
    plan_distribution: planDist.map((p) => ({ name: p._id || 'free', value: p.count })),
  };
};

// ── Super-admin: all users ───────────────────────────────────────────
const getSuperUsers = async () => {
  const users = await User.find()
    .populate('organizationId', 'name slug')
    .sort({ createdAt: -1 })
    .lean();

  return users.map((u) => ({
    id: u._id,
    display_name: u.displayName,
    email: u.email,
    org_name: u.organizationId?.name || null,
    org_id: u.organizationId?._id || null,
    roles: [u.role],
    last_sign_in_at: u.lastLoginAt || null,
    created_at: u.createdAt,
    is_active: u.isActive,
    is_email_verified: u.isEmailVerified,
  }));
};

// ── Super-admin: assign role ─────────────────────────────────────────
const assignRole = async (userId, role) => {
  const allowed = ['user', 'admin', 'super_admin'];
  if (!allowed.includes(role)) throw new AppError('Invalid role', 400);
  await User.findByIdAndUpdate(userId, { role });
};

// ── Super-admin: all organizations ──────────────────────────────────
const getSuperOrgs = async () => {
  const orgs = await Organization.find().sort({ createdAt: -1 }).lean();
  return orgs.map((o) => ({
    id: o._id,
    name: o.name,
    slug: o.slug,
    plan: o.plan,
    logo_url: o.logoUrl,
    billing_cycle_start: o.billingCycleStart,
    billing_cycle_end: o.billingCycleEnd,
    created_at: o.createdAt,
  }));
};

// ── Super-admin: change org plan ─────────────────────────────────────
const changeOrgPlan = async (orgId, plan) => {
  const allowed = ['free', 'starter', 'pro', 'enterprise'];
  if (!allowed.includes(plan)) throw new AppError('Invalid plan', 400);
  const now = new Date();
  await Organization.findByIdAndUpdate(orgId, {
    plan,
    billingCycleStart: now,
    billingCycleEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
  });
};

// ── Super-admin: all certificates ───────────────────────────────────
const getSuperCerts = async () => {
  const certs = await Certificate.find()
    .populate('organizationId', 'name')
    .populate('templateId', 'title')
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();

  return certs.map((c) => ({
    id: c._id,
    certificate_number: c.certificateNumber,
    recipient_name: c.recipientName,
    recipient_email: c.recipientEmail,
    status: c.status,
    issue_date: c.issueDate,
    is_external: c.isExternal,
    created_at: c.createdAt,
    org_name: c.organizationId?.name || null,
    template_title: c.templateId?.title || null,
  }));
};

// ── Super-admin: revoke / restore cert ──────────────────────────────
const setCertStatus = async (certId, status) => {
  if (!['issued', 'revoked'].includes(status)) throw new AppError('Invalid status', 400);
  await Certificate.findByIdAndUpdate(certId, { status });
};

// ── Super-admin: all templates ───────────────────────────────────────
const getSuperTemplates = async () => {
  const templates = await Template.find()
    .populate('organizationId', 'name')
    .sort({ createdAt: -1 })
    .lean();

  return templates.map((t) => ({
    id: t._id,
    title: t.title,
    subtitle: t.configuration?.subtitle || null,
    number_prefix: t.numberPrefix,
    layout: t.layout,
    is_active: t.isActive,
    is_system: t.isSystem || false,
    org_name: t.organizationId?.name || null,
    categories: t.categories || [],
    description: t.description || "",
    colorTheme: t.colorTheme || null,
    samplePdfUrl: t.samplePdfUrl || null,
    sampleImageUrl: t.sampleImageUrl || null,
    created_at: t.createdAt,
  }));
};

const updateSuperTemplate = async (templateId, updates) => {
  const allowed = ['samplePdfUrl', 'sampleImageUrl', 'description', 'categories', 'colorTheme', 'isActive'];
  const filtered = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) filtered[key] = updates[key];
  }
  const template = await Template.findByIdAndUpdate(templateId, { $set: filtered }, { new: true }).lean();
  if (!template) throw new (require('../../middlewares/error.middleware').AppError)('Template not found', 404);
  return template;
};

// ── Super-admin: billing (orders + coupons) ──────────────────────────
const getSuperBilling = async () => {
  const [orders, coupons, orgs] = await Promise.all([
    Order.find().populate('organizationId', 'name').sort({ createdAt: -1 }).lean(),
    Coupon.find().sort({ createdAt: -1 }).lean(),
    Organization.find().select('name plan billingCycleStart billingCycleEnd').lean(),
  ]);

  return {
    orders: orders.map((o) => ({
      id: o._id,
      org_name: o.organizationId?.name || null,
      plan_name: o.planName,
      original_price: o.originalPrice,
      discount_percent: o.discountPercent,
      coupon_code: o.couponCode || null,
      final_amount: o.finalAmount,
      status: o.status,
      created_at: o.createdAt,
    })),
    subscriptions: orgs.map((o) => ({
      id: o._id,
      org_name: o.name,
      plan: o.plan,
      billing_cycle_start: o.billingCycleStart,
      billing_cycle_end: o.billingCycleEnd,
    })),
    coupons: coupons.map((c) => ({
      id: c._id,
      code: c.code,
      discount_percent: c.discountPercent,
      current_uses: c.currentUses,
      max_uses: c.maxUses,
      is_active: c.isActive,
      expires_at: c.expiresAt,
      created_at: c.createdAt,
    })),
  };
};

// ── Super-admin: plans config (from planConfig.js) ───────────────────
const { PLANS } = require('../../utils/planConfig');
const getSuperPlans = async () => {
  return Object.entries(PLANS).map(([id, p], i) => ({
    id,
    name: p.name,
    price_monthly: p.price,
    max_certificates_per_month: p.limits.certificates_created,
    max_templates: p.limits.templates_created,
    team_members: p.limits.team_members,
    api_access: !!p.features?.api_access,
    bulk_import: !!p.features?.bulk_import,
    webhook_access: !!p.features?.webhook_access,
    analytics_access: !!p.features?.analytics_access,
    audit_exports: !!p.features?.audit_exports,
    priority_support: !!p.features?.priority_support,
    display_order: i,
  }));
};

// ── Super-admin: audit logs (from Event collection) ──────────────────
const getAuditLogs = async () => {
  const events = await Event.find()
    .populate('actorId', 'displayName email')
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();

  return events.map((e) => ({
    id: e._id,
    action: e.eventType,
    target_type: 'certificate',
    target_id: e.certificateId,
    details: e.description || null,
    actor_id: e.actorId?._id || null,
    actor_name: e.actorId?.displayName || null,
    created_at: e.createdAt,
  }));
};

// ── Legacy admin helpers ─────────────────────────────────────────────
const logAdminAction = async (userId, action) => {
  // Events are certificate-scoped; for admin actions we skip DB logging
  // and just return success (audit log UI reads Event collection)
};

const listUserRoles = async () => {
  return await User.find().select('displayName email role');
};

module.exports = {
  getSuperStats,
  getSuperUsers,
  assignRole,
  getSuperOrgs,
  changeOrgPlan,
  getSuperCerts,
  setCertStatus,
  getSuperTemplates,
  updateSuperTemplate,
  getSuperBilling,
  getSuperPlans,
  getAuditLogs,
  logAdminAction,
  listUserRoles,
};
