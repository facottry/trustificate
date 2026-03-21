const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    logoUrl: { type: String, default: null },
    plan: { type: String, enum: ['free', 'starter', 'pro', 'enterprise'], default: 'free' },
    billingCycleStart: { type: Date, default: Date.now },
    billingCycleEnd: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    // Extended profile fields
    website: {
      type: String,
      default: null,
      validate: {
        validator: (v) => !v || /^https?:\/\/.+/.test(v),
        message: 'Website must be a valid URL starting with http:// or https://',
      },
    },
    industry: { type: String, default: null, trim: true },
    description: {
      type: String,
      default: null,
      maxlength: [500, 'Description must be under 500 characters'],
    },
    contactEmail: {
      type: String,
      default: null,
      lowercase: true,
      trim: true,
      validate: {
        validator: (v) => !v || /\S+@\S+\.\S+/.test(v),
        message: 'Invalid contact email format',
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Organization', organizationSchema);
