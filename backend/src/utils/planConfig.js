const PLANS = {
  free: {
    name: 'Free',
    limits: {
      certificates_created: 10,
      templates_created: 1,
    },
    features: {
      bulk_import: false,
      api_access: false,
      webhook_access: false,
      analytics_access: false,
      priority_support: false,
    },
    price: 0,
    originalPrice: 0,
  },
  starter: {
    name: 'Starter',
    limits: {
      certificates_created: 500,
      templates_created: 10,
    },
    features: {
      bulk_import: true,
      api_access: true,
      webhook_access: false,
      analytics_access: false,
      priority_support: false,
    },
    price: 999,
    originalPrice: 1999,
  },
  pro: {
    name: 'Pro',
    limits: {
      certificates_created: -1,
      templates_created: -1,
    },
    features: {
      bulk_import: true,
      api_access: true,
      webhook_access: true,
      analytics_access: true,
      priority_support: true,
    },
    price: 3499,
    originalPrice: 6999,
  },
  enterprise: {
    name: 'Enterprise',
    limits: {
      certificates_created: -1,
      templates_created: -1,
    },
    features: {
      bulk_import: true,
      api_access: true,
      webhook_access: true,
      analytics_access: true,
      priority_support: true,
    },
    price: -1,
    originalPrice: -1,
  },
};

const getPlan = (planId) => PLANS[planId] || PLANS.free;

const isUnlimited = (limit) => limit === -1;

module.exports = { PLANS, getPlan, isUnlimited };
