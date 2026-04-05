const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema(
  {
    name: { type: String, default: '', trim: true },
    title: { type: String, required: true, trim: true },
    placeholders: { type: [String], default: [] },
    numberPrefix: { type: String, default: 'CERT' },
    isActive: { type: Boolean, default: true },
    layout: { type: String, default: null },
    configuration: { type: mongoose.Schema.Types.Mixed, default: {} },
    isSystem: { type: Boolean, default: false },
    categories: { type: [String], default: [], index: true },
    description: { type: String, default: '', trim: true, maxlength: 300 },
    colorTheme: { type: String, default: null },
    previewUrl: { type: String, default: null },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Template', templateSchema);
