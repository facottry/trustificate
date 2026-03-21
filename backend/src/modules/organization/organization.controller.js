const organizationService = require('./organization.service');
const { asyncHandler } = require('../../middlewares/error.middleware');
const { success } = require('../../utils/apiResponse');
const { uploadCertificate } = require('../../services/cloudflareR2Service');

const createOrganization = asyncHandler(async (req, res) => {
  const { name, slug, logoUrl } = req.body;
  const org = await organizationService.createOrganization({ name, slug, logoUrl }, req.user.id);
  success(res, org, 'Organization created', 201);
});

const listOrganizations = asyncHandler(async (req, res) => {
  const orgs = await organizationService.getOrganizationsForUser(req.user.id);
  success(res, orgs);
});

const getOrganization = asyncHandler(async (req, res) => {
  const org = await organizationService.getOrganizationById(req.params.id, req.user.id);
  success(res, org);
});

const updateOrganization = asyncHandler(async (req, res) => {
  const org = await organizationService.updateOrganization(req.params.id, req.user.id, req.body);
  success(res, org, 'Organization updated');
});

const deleteOrganization = asyncHandler(async (req, res) => {
  const result = await organizationService.deleteOrganization(req.params.id, req.user.id);
  success(res, null, result.message);
});

const getUsage = asyncHandler(async (req, res) => {
  const usage = await organizationService.getUsage(req.params.id, req.user.id);
  success(res, usage);
});

const incrementUsage = asyncHandler(async (req, res) => {
  const { metric, amount } = req.body;
  const result = await organizationService.incrementUsage(req.params.id, req.user.id, metric, amount);
  success(res, result);
});

const getTeamMembers = asyncHandler(async (req, res) => {
  const members = await organizationService.getTeamMembers(req.params.id);
  success(res, members);
});

const uploadLogo = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  const { buffer, originalname, mimetype } = req.file;
  const key = `logos/${req.params.id}-${Date.now()}-${originalname}`;
  const { url } = await uploadCertificate(buffer, key, mimetype);
  const org = await organizationService.updateOrganization(req.params.id, req.user.id, { logoUrl: url });
  success(res, org, 'Logo uploaded');
});

module.exports = {
  createOrganization,
  listOrganizations,
  getOrganization,
  updateOrganization,
  deleteOrganization,
  getUsage,
  incrementUsage,
  getTeamMembers,
  uploadLogo,
};
