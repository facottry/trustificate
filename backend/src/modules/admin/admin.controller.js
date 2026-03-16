const adminService = require('./admin.service');
const { asyncHandler } = require('../../middlewares/error.middleware');
const { success } = require('../../utils/apiResponse');

const getAdminUsers = asyncHandler(async (req, res) => {
  const users = await adminService.getAdminUsers();
  success(res, users);
});

const logAdminAction = asyncHandler(async (req, res) => {
  await adminService.logAdminAction(req.user.id, req.body);
  success(res, null, 'Action logged');
});

const assignUserRole = asyncHandler(async (req, res) => {
  const { userId, role } = req.body;
  await adminService.assignUserRole(userId, role);
  success(res, null, 'Role assigned');
});

const listUserRoles = asyncHandler(async (req, res) => {
  const roles = await adminService.listUserRoles();
  success(res, roles);
});

module.exports = { getAdminUsers, logAdminAction, assignUserRole, listUserRoles };