const Plan = require('./plan.schema');

const DEFAULT_PLANS = [
  {
    planId: 'free', name: 'Free', price: 0, originalPrice: 0, displayOrder: 0,
    limits: { certificates_created: 10, templates_created: 1, team_members: 1 },
    features: { bulk_import: false, api_access: false, webhook_access: false, analytics_access: false, audit_exports: false, priority_support: false },
    description: 'For individuals exploring credential issuance.',
    featureList: ['Up to 10 credentials/month', '1 template', 'Public verification pages', 'QR code generation', 'Basic analytics', 'Community support'],
    cta: 'Get Started Free', ctaVariant: 'outline', popular: false, discount: null,
  },
  {
    planId: 'starter', name: 'Starter', price: 999, originalPrice: 1999, displayOrder: 1,
    limits: { certificates_created: 500, templates_created: 10, team_members: 3 },
    features: { bulk_import: true, api_access: true, webhook_access: false, analytics_access: false, audit_exports: false, priority_support: false },
    description: 'For growing teams with regular issuance needs.',
    featureList: ['Up to 500 credentials/month', '10 templates', 'Custom branding', 'External certificate registry', 'PDF export & download', 'Email support', 'REST API access'],
    cta: 'Choose Starter', ctaVariant: 'outline', popular: false, discount: '50% OFF',
  },
  {
    planId: 'pro', name: 'Pro', price: 3499, originalPrice: 6999, displayOrder: 2,
    limits: { certificates_created: -1, templates_created: -1, team_members: 10 },
    features: { bulk_import: true, api_access: true, webhook_access: true, analytics_access: true, audit_exports: true, priority_support: true },
    description: 'For institutions needing advanced features and scale.',
    featureList: ['10,000+ credentials/month', '10,000+ templates', 'Custom branding & domain', 'Bulk issuance (CSV import)', 'AI-powered form assistance', 'Advanced analytics & dashboards', 'Webhook integrations', 'Priority support', 'Audit trail export', 'Team roles & permissions'],
    cta: 'Choose Pro', ctaVariant: 'default', popular: true, discount: '50% OFF',
  },
  {
    planId: 'enterprise', name: 'Enterprise', price: -1, originalPrice: -1, displayOrder: 3,
    limits: { certificates_created: -1, templates_created: -1, team_members: -1 },
    features: { bulk_import: true, api_access: true, webhook_access: true, analytics_access: true, audit_exports: true, priority_support: true },
    description: 'For large organizations with compliance and security needs.',
    featureList: ['Everything in Pro', 'SSO / SAML authentication', 'Dedicated account manager', 'Custom SLA guarantee', 'On-premise deployment option', 'SOC 2 Type II report', 'Custom API integrations', 'Training & onboarding', 'Volume-based discounts'],
    cta: 'Talk to Sales', ctaVariant: 'outline', popular: false, discount: null,
  },
];

const seedPlans = async () => {
  try {
    const existing = await Plan.find().lean();
    const existingIds = new Set(existing.map((p) => p.planId));

    let created = 0;
    let updated = 0;
    for (const p of DEFAULT_PLANS) {
      if (!existingIds.has(p.planId)) {
        await Plan.create({ ...p, isActive: true });
        created++;
      } else {
        // Update existing plans with new display fields if missing
        const found = existing.find((e) => e.planId === p.planId);
        const updates = {};
        if (!found.description && p.description) updates.description = p.description;
        if (!found.featureList?.length && p.featureList?.length) updates.featureList = p.featureList;
        if (!found.cta) updates.cta = p.cta;
        if (!found.ctaVariant) updates.ctaVariant = p.ctaVariant;
        if (found.popular === undefined) updates.popular = p.popular;
        if (found.discount === undefined) updates.discount = p.discount;
        if (Object.keys(updates).length > 0) {
          await Plan.updateOne({ _id: found._id }, { $set: updates });
          updated++;
        }
      }
    }
    if (created > 0) console.log(`  ✅  Seeded ${created} plans into database`);
    if (updated > 0) console.log(`  ✅  Updated ${updated} plans with display fields`);
  } catch (err) {
    console.error('  ❌  Error seeding plans:', err.message);
  }
};

module.exports = { seedPlans };
