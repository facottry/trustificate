const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    planName: { type: String, required: true },
    originalPrice: { type: Number },
    discountPercent: { type: Number, default: 0 },
    discountedPrice: { type: Number },
    couponCode: { type: String },
    couponDiscountPercent: { type: Number, default: 0 },
    finalAmount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['completed', 'pending', 'failed'], default: 'pending' },
    paymentMethod: { type: String },
    metadata: { type: Object },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
