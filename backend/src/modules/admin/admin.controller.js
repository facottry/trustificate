const adminService = require('./admin.service');
const { asyncHandler } = require('../../middlewares/error.middleware');
const { success } = require('../../utils/apiResponse');

const getSuperStats    = asyncHandler(async (req, res) => { success(res, await adminService.getSuperStats()); });
const getSuperUsers    = asyncHandler(async (req, res) => { success(res, await adminService.getSuperUsers()); });
const assignRole       = asyncHandler(async (req, res) => {
  await adminService.assignRole(req.params.userId, req.body.role);
  success(res, null, 'Role updated');
});
const getSuperOrgs     = asyncHandler(async (req, res) => { success(res, await adminService.getSuperOrgs()); });
const changeOrgPlan    = asyncHandler(async (req, res) => {
  await adminService.changeOrgPlan(req.params.orgId, req.body.plan);
  success(res, null, 'Plan updated');
});
const getSuperCerts    = asyncHandler(async (req, res) => { success(res, await adminService.getSuperCerts()); });
const setCertStatus    = asyncHandler(async (req, res) => {
  await adminService.setCertStatus(req.params.certId, req.body.status);
  success(res, null, 'Certificate updated');
});
const getSuperTemplates = asyncHandler(async (req, res) => { success(res, await adminService.getSuperTemplates()); });
const updateSuperTemplate = asyncHandler(async (req, res) => {
  const data = await adminService.updateSuperTemplate(req.params.templateId, req.body);
  success(res, data, 'Template updated');
});
const getSuperBilling  = asyncHandler(async (req, res) => { success(res, await adminService.getSuperBilling()); });
const getSuperPlans    = asyncHandler(async (req, res) => { success(res, await adminService.getSuperPlans()); });
const getAuditLogs     = asyncHandler(async (req, res) => { success(res, await adminService.getAuditLogs()); });
const logAdminAction   = asyncHandler(async (req, res) => {
  await adminService.logAdminAction(req.user.id, req.body);
  success(res, null, 'Logged');
});
const listUserRoles    = asyncHandler(async (req, res) => { success(res, await adminService.listUserRoles()); });

module.exports = {
  getSuperStats, getSuperUsers, assignRole,
  getSuperOrgs, changeOrgPlan,
  getSuperCerts, setCertStatus,
  getSuperTemplates, updateSuperTemplate,
  getSuperBilling,
  getSuperPlans,
  getAuditLogs,
  logAdminAction, listUserRoles,
};
