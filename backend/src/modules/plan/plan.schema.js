const mongoose = require('mongoose');

const planSchema = new mongoose.Schema(
  {
    planId: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, default: 0 },
    originalPrice: { type: Number, default: 0 },
    limits: {
      certificates_created: { type: Number, default: 10 },
      templates_created: { type: Number, default: 1 },
      team_members: { type: Number, default: 1 },
    },
    features: {
      bulk_import: { type: Boolean, default: false },
      api_access: { type: Boolean, default: false },
      webhook_access: { type: Boolean, default: false },
      analytics_access: { type: Boolean, default: false },
      audit_exports: { type: Boolean, default: false },
      priority_support: { type: Boolean, default: false },
    },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    description: { type: String, default: '', trim: true },
    featureList: { type: [String], default: [] },
    cta: { type: String, default: 'Get Started', trim: true },
    ctaVariant: { type: String, enum: ['default', 'outline'], default: 'outline' },
    popular: { type: Boolean, default: false },
    discount: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Plan', planSchema);
