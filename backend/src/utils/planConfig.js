// Hardcoded fallback plans — used until DB plans are loaded
const PLANS = {
  free: {
    name: 'Free',
    limits: { certificates_created: 10, templates_created: 1, team_members: 1 },
    features: { bulk_import: false, api_access: false, webhook_access: false, analytics_access: false, audit_exports: false, priority_support: false },
    price: 0, originalPrice: 0,
  },
  starter: {
    name: 'Starter',
    limits: { certificates_created: 500, templates_created: 10, team_members: 3 },
    features: { bulk_import: true, api_access: true, webhook_access: false, analytics_access: false, audit_exports: false, priority_support: false },
    price: 999, originalPrice: 1999,
  },
  pro: {
    name: 'Pro',
    limits: { certificates_created: -1, templates_created: -1, team_members: 10 },
    features: { bulk_import: true, api_access: true, webhook_access: true, analytics_access: true, audit_exports: true, priority_support: true },
    price: 3499, originalPrice: 6999,
  },
  enterprise: {
    name: 'Enterprise',
    limits: { certificates_created: -1, templates_created: -1, team_members: -1 },
    features: { bulk_import: true, api_access: true, webhook_access: true, analytics_access: true, audit_exports: true, priority_support: true },
    price: -1, originalPrice: -1,
  },
};

// In-memory cache of DB plans
let dbPlans = null;
let lastFetch = 0;
const CACHE_TTL = 60_000; // 1 minute

const loadPlansFromDB = async () => {
  if (dbPlans && Date.now() - lastFetch < CACHE_TTL) return dbPlans;
  try {
    const Plan = require('../modules/plan/plan.schema');
    const plans = await Plan.find({ isActive: true }).sort({ displayOrder: 1 }).lean();
    if (plans.length > 0) {
      dbPlans = {};
      for (const p of plans) {
        dbPlans[p.planId] = {
          name: p.name,
          limits: p.limits,
          features: p.features,
          price: p.price,
          originalPrice: p.originalPrice,
        };
      }
      lastFetch = Date.now();
    }
  } catch { /* DB not ready yet, use fallback */ }
  return dbPlans;
};

const getPlan = (planId) => {
  if (dbPlans && dbPlans[planId]) return dbPlans[planId];
  return PLANS[planId] || PLANS.free;
};

const getAllPlans = () => {
  return dbPlans || PLANS;
};

const isUnlimited = (limit) => limit === -1;

// Invalidate cache so next getPlan reads from DB
const invalidateCache = () => { dbPlans = null; lastFetch = 0; };

module.exports = { PLANS, getPlan, getAllPlans, isUnlimited, loadPlansFromDB, invalidateCache };
