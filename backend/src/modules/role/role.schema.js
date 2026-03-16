const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    role: { type: String, enum: ['admin', 'user'], required: true },
  },
  { timestamps: true }
);

roleSchema.index({ userId: 1, organizationId: 1 }, { unique: true });

module.exports = mongoose.model('Role', roleSchema);
