const templateService = require('./template.service');
const { asyncHandler } = require('../../middlewares/error.middleware');
const { success } = require('../../utils/apiResponse');

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

// const uploadTemplate = asyncHandler(async (req, res) => {
//   if (!req.file) throw new Error('No file uploaded');
//   // For now, return a mock URL
//   const url = `http://localhost:3000/uploads/${req.file.filename}`;
//   success(res, { url }, 'File uploaded');
// });

module.exports = { createTemplate, listTemplates, getTemplate, updateTemplate, deleteTemplate };
