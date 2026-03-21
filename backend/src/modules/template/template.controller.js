const templateService = require('./template.service');
const { asyncHandler } = require('../../middlewares/error.middleware');
const { success } = require('../../utils/apiResponse');

// Try to load R2 upload service
let uploadCertificate;
try {
  uploadCertificate = require('../../services/cloudflareR2Service').uploadCertificate;
} catch { uploadCertificate = null; }

const createTemplate = asyncHandler(async (req, res) => {
  const { title, placeholders, isActive, layout, configuration } = req.body;
  const template = await templateService.createTemplate(
    { title, placeholders, isActive, layout, configuration },
    req.user.organizationId,
    req.user.id
  );
  success(res, template, 'Template created', 201);
});

const listTemplates = asyncHandler(async (req, res) => {
  const templates = await templateService.listTemplates(req.user.organizationId);
  success(res, templates);
});

const getTemplate = asyncHandler(async (req, res) => {
  const template = await templateService.getTemplate(req.params.id, req.user.organizationId);
  success(res, template);
});

const updateTemplate = asyncHandler(async (req, res) => {
  const template = await templateService.updateTemplate(req.params.id, req.body, req.user.organizationId);
  success(res, template, 'Template updated');
});

const deleteTemplate = asyncHandler(async (req, res) => {
  const result = await templateService.deleteTemplate(req.params.id, req.user.organizationId);
  success(res, null, result.message);
});

const uploadAsset = asyncHandler(async (req, res) => {
  if (!req.file) throw new Error('No file uploaded');
  if (!uploadCertificate) throw new Error('Storage service not configured');

  const ext = req.file.originalname.split('.').pop() || 'png';
  const folder = req.query.type === 'seal' ? 'seals' : 'signatures';
  const fileName = `${folder}/${req.user.organizationId}-${Date.now()}.${ext}`;

  const { url } = await uploadCertificate(req.file.buffer, fileName, req.file.mimetype);
  success(res, { url }, 'Asset uploaded');
});

module.exports = { createTemplate, listTemplates, getTemplate, updateTemplate, deleteTemplate, uploadAsset };
