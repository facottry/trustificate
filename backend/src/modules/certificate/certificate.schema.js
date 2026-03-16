const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
  {
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Template', required: true },
    certificateNumber: { type: String, required: true, unique: true, trim: true },
    status: { type: String, enum: ['issued', 'revoked'], default: 'issued' },
    pdfUrl: { type: String, default: null },
    pdfKey: { type: String, default: null },
    recipientDetails: { type: mongoose.Schema.Types.Mixed, default: {} },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Certificate', certificateSchema);
