const mongoose = require('mongoose');

const crypto = require('crypto');

const newsletterSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sentAt: { type: Date, default: Date.now },
    recipientCount: { type: Number, required: true },
  },
  { timestamps: true }
);

newsletterSchema.pre('save', function (next) {
  if (this.isNew && !this.slug) {
    const base = this.subject
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    const suffix = crypto.randomUUID().slice(0, 6);
    this.slug = `${base}-${suffix}`;
  }
  next();
});

module.exports = mongoose.model('Newsletter', newsletterSchema);
