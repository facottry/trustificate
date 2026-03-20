const mongoose = require('mongoose');

const usageSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    metric: { type: String, required: true },
    count: { type: Number, default: 0 },
    billingCycleStart: { type: Date, required: true },
    billingCycleEnd: { type: Date, required: true },
  },
  { timestamps: true }
);

usageSchema.index({ organizationId: 1, metric: 1, billingCycleStart: 1 });

module.exports = mongoose.model('Usage', usageSchema);
