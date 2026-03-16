const User = require('../user/user.schema');
const Event = require('../event/event.schema');

const getAdminUsers = async () => {
  return await User.find({ role: 'admin' }).select('displayName email');
};

const logAdminAction = async (userId, action) => {
  await Event.create({
    userId,
    type: 'admin_action',
    description: action.description || 'Admin action',
    metadata: action,
  });
};

const assignUserRole = async (userId, role) => {
  await User.findByIdAndUpdate(userId, { role });
};

const listUserRoles = async () => {
  return await User.find().select('displayName email role');
};

module.exports = { getAdminUsers, logAdminAction, assignUserRole, listUserRoles };