const Template = require('./template.schema');
const { AppError } = require('../../middlewares/error.middleware');
const usageService = require('../usage/usage.service');
const { ensureBillingCycle } = require('../organization/organization.service');

const createTemplate = async ({ name, title, placeholders, isActive, layout, numberPrefix, configuration }, organizationId, userId) => {
  if (!organizationId) throw new AppError('Organization context missing', 400);
  const template = await Template.create({
    name,
    title,
    placeholders,
    numberPrefix: numberPrefix || 'CERT',
    isActive: isActive !== false,
    layout,
    configuration,
    organizationId,
    createdBy: userId,
    isSystem: false,
  });

  // Increment usage after successful template creation
  const org = await ensureBillingCycle(template.organizationId);
  if (org) {
    await usageService.incrementUsage(org._id, 'templates_created', org.billingCycleStart, org.billingCycleEnd);
  }

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

  // Only allow known schema fields
  const allowed = {};
  const fields = ['name', 'title', 'placeholders', 'numberPrefix', 'isActive', 'layout', 'configuration'];
  for (const f of fields) {
    if (data[f] !== undefined) allowed[f] = data[f];
  }

  const template = await Template.findOneAndUpdate({ _id: id, organizationId }, allowed, {
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
