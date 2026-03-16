const mongoose = require('mongoose');

const externalCertificateSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    issuerName: { type: String, required: true, trim: true },
    originalUrl: { type: String, required: true, trim: true },
    pdfBucketPath: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ExternalCertificate', externalCertificateSchema);
