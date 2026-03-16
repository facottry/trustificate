const userService = require('./user.service');
const { asyncHandler } = require('../../middlewares/error.middleware');
const { success, paginate } = require('../../utils/apiResponse');

/** GET /api/users/me */
const getMe = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.user.id);
  success(res, user);
});

/** GET /api/users (admin only) */
const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const { users, total } = await userService.getAllUsers({ page, limit });
  paginate(res, users, total, page, limit);
});

/** GET /api/users/:id */
const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  success(res, user);
});

/** PUT /api/users/:id */
const updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body);
  success(res, user, 'User updated');
});

/** DELETE /api/users/:id (admin only) */
const deleteUser = asyncHandler(async (req, res) => {
  const result = await userService.deleteUser(req.params.id);
  success(res, null, result.message);
});

/** PUT /api/users/change-password */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const result = await userService.changePassword(req.user.id, currentPassword, newPassword);
  success(res, null, result.message);
});

module.exports = { getMe, getAllUsers, getUserById, updateUser, deleteUser, changePassword };
