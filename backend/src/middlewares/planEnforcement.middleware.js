const { ensureBillingCycle } = require('../modules/organization/organization.service');
const usageService = require('../modules/usage/usage.service');
const { getPlan, isUnlimited } = require('../utils/planConfig');
const { AppError } = require('./error.middleware');

const enforcePlanLimit = (metric) => async (req, res, next) => {
  const org = await ensureBillingCycle(req.user.organizationId);
  if (!org) throw new AppError('Organization not found', 404);

  const planConfig = getPlan(org.plan);
  const limit = planConfig.limits[metric];

  if (isUnlimited(limit)) return next();

  const now = new Date();
  const usage = now > org.billingCycleEnd
    ? 0
    : await usageService.getUsageForMetric(org._id, metric, org.billingCycleStart, org.billingCycleEnd);

  if (usage >= limit) {
    throw new AppError(
      `Plan limit reached: you have used ${usage}/${limit} ${metric.replace(/_/g, ' ')} this billing cycle. Upgrade your plan to continue.`,
      403
    );
  }

  // Bulk operation check
  const rows = req.body && (req.body.recipients || req.body.rows);
  if (Array.isArray(rows)) {
    const remaining = limit - usage;
    if (rows.length > remaining) {
      throw new AppError(
        `Bulk upload would exceed plan limit: ${rows.length} certificates requested but only ${remaining} remaining.`,
        403
      );
    }
  }

  next();
};

module.exports = { enforcePlanLimit };
