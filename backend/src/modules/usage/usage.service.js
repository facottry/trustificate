const Usage = require('./usage.schema');

/**
 * Get all usage counters for an organization within a billing cycle.
 * Returns an object like { certificates_created: N, templates_created: N }.
 * Missing metrics default to 0.
 */
const getUsageForOrg = async (orgId, cycleStart, cycleEnd) => {
  const records = await Usage.find({
    organizationId: orgId,
    billingCycleStart: cycleStart,
    billingCycleEnd: cycleEnd,
  }).lean();

  const usage = {
    certificates_created: 0,
    templates_created: 0,
  };

  for (const record of records) {
    usage[record.metric] = record.count;
  }

  return usage;
};

/**
 * Increment (or create) a usage counter for a specific metric within a billing cycle.
 * Uses MongoDB $inc for atomic upsert.
 */
const incrementUsage = async (orgId, metric, cycleStart, cycleEnd, amount = 1) => {
  const doc = await Usage.findOneAndUpdate(
    {
      organizationId: orgId,
      metric,
      billingCycleStart: cycleStart,
    },
    {
      $inc: { count: amount },
      $setOnInsert: {
        organizationId: orgId,
        metric,
        billingCycleStart: cycleStart,
        billingCycleEnd: cycleEnd,
      },
    },
    { upsert: true, new: true }
  );
  return doc;
};

/**
 * Get the usage count for a single metric within a billing cycle.
 * Returns 0 if no record exists.
 */
const getUsageForMetric = async (orgId, metric, cycleStart, cycleEnd) => {
  const record = await Usage.findOne({
    organizationId: orgId,
    metric,
    billingCycleStart: cycleStart,
    billingCycleEnd: cycleEnd,
  }).lean();

  return record ? record.count : 0;
};

module.exports = {
  getUsageForOrg,
  incrementUsage,
  getUsageForMetric,
};
