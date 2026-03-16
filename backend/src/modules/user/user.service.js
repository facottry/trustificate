const User = require('./user.schema');
const { AppError } = require('../../middlewares/error.middleware');

const getAllUsers = async ({ page = 1, limit = 10 } = {}) => {
  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find({ isActive: true }).select('-passwordHash').skip(skip).limit(Number(limit)).lean(),
    User.countDocuments({ isActive: true }),
  ]);
  return { users, total };
};

const getUserById = async (id) => {
  const user = await User.findById(id).select('-passwordHash').lean();
  if (!user) throw new AppError('User not found', 404);
  return user;
};

const updateUser = async (id, data) => {
  ['passwordHash', 'role', '_id'].forEach((f) => delete data[f]);
  const user = await User.findByIdAndUpdate(id, data, { new: true, runValidators: true }).select('-passwordHash').lean();
  if (!user) throw new AppError('User not found', 404);
  return user;
};

const deleteUser = async (id) => {
  const user = await User.findByIdAndUpdate(id, { isActive: false }, { new: true });
  if (!user) throw new AppError('User not found', 404);
  return { message: 'User deleted successfully' };
};

const changePassword = async (id, currentPassword, newPassword) => {
  const user = await User.findById(id).select('+passwordHash');
  if (!user) throw new AppError('User not found', 404);
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw new AppError('Current password is incorrect', 400);
  user.password = newPassword;
  await user.save();
  return { message: 'Password changed successfully' };
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser, changePassword };
