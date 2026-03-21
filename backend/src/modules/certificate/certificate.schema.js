const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
  {
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Template', required: true },
    certificateNumber: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, unique: true, sparse: true, trim: true },
    status: { type: String, enum: ['draft', 'issued', 'revoked'], default: 'issued' },
    pdfUrl: { type: String, default: null },
    pdfKey: { type: String, default: null },
    // Individual recipient fields (frontend-friendly)
    recipientName: { type: String, default: '' },
    recipientEmail: { type: String, default: '' },
    courseName: { type: String, default: '' },
    trainingName: { type: String, default: '' },
    companyName: { type: String, default: '' },
    score: { type: String, default: '' },
    durationText: { type: String, default: '' },
    issuerName: { type: String, default: 'TRUSTIFICATE' },
    issuerTitle: { type: String, default: '' },
    issueDate: { type: Date, default: Date.now },
    completionDate: { type: Date, default: null },
    isExternal: { type: Boolean, default: false },
    originalIssuer: { type: String, default: '' },
    externalVerificationUrl: { type: String, default: '' },
    externalPdfUrl: { type: String, default: '' },
    notes: { type: String, default: '' },
    // Legacy mixed field for backward compat
    recipientDetails: { type: mongoose.Schema.Types.Mixed, default: {} },
    metadataJson: { type: mongoose.Schema.Types.Mixed, default: {} },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

certificateSchema.index({ organizationId: 1, createdAt: -1 });

module.exports = mongoose.model('Certificate', certificateSchema);
