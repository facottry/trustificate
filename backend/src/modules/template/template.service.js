const Template = require('./template.schema');
const { AppError } = require('../../middlewares/error.middleware');

const createTemplate = async ({ title, placeholders, isActive, layout, configuration }, organizationId, userId) => {
  if (!organizationId) throw new AppError('Organization context missing', 400);
  const template = await Template.create({
    title,
    placeholders,
    isActive: isActive !== false,
    layout,
    configuration,
    organizationId,
    createdBy: userId,
    isSystem: false,
  });
  return template;
};

const listTemplates = async (organizationId) => {
  if (!organizationId) throw new AppError('Organization context missing', 400);
  return Template.find({
    $or: [{ organizationId }, { isSystem: true }],
  })
    .sort({ title: 1 })
    .lean();
};

const getTemplate = async (id, organizationId) => {
  if (!organizationId) throw new AppError('Organization context missing', 400);
  const template = await Template.findOne({
    _id: id,
    $or: [{ organizationId }, { isSystem: true }],
  });
  if (!template) throw new AppError('Template not found', 404);
  return template;
};

const updateTemplate = async (id, data, organizationId) => {
  if (!organizationId) throw new AppError('Organization context missing', 400);
  const existing = await Template.findOne({ _id: id });
  if (!existing) throw new AppError('Template not found', 404);
  if (existing.isSystem) throw new AppError('Cannot modify built-in template', 403);

  const template = await Template.findOneAndUpdate({ _id: id, organizationId }, data, {
    new: true,
    runValidators: true,
  });
  if (!template) throw new AppError('Template not found', 404);
  return template;
};

const deleteTemplate = async (id, organizationId) => {
  if (!organizationId) throw new AppError('Organization context missing', 400);
  const existing = await Template.findOne({ _id: id });
  if (!existing) throw new AppError('Template not found', 404);
  if (existing.isSystem) throw new AppError('Cannot delete built-in template', 403);

  const template = await Template.findOneAndDelete({ _id: id, organizationId });
  if (!template) throw new AppError('Template not found', 404);
  return { message: 'Template deleted' };
};

module.exports = { createTemplate, listTemplates, getTemplate, updateTemplate, deleteTemplate };
