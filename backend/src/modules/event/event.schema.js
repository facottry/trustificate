const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    certificateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Certificate', required: true },
    eventType: { type: String, enum: ['issued', 'revoked', 'viewed'], required: true },
    timestamp: { type: Date, default: Date.now },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Event', eventSchema);
