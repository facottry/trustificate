const inviteService = require('./invite.service');
const { asyncHandler } = require('../../middlewares/error.middleware');
const { success } = require('../../utils/apiResponse');

const sendInvite = asyncHandler(async (req, res) => {
  const { email, role } = req.body;
  const organizationId = req.params.orgId;
  const invitedBy = req.user.id;
  const invite = await inviteService.createInvite(email, organizationId, invitedBy, role);
  success(res, invite, 'Invite sent', 201);
});

const listInvites = asyncHandler(async (req, res) => {
  const invites = await inviteService.listInvitesForOrg(req.params.orgId);
  success(res, invites);
});

const revokeInvite = asyncHandler(async (req, res) => {
  const invite = await inviteService.revokeInvite(req.params.inviteId, req.params.orgId);
  success(res, invite, 'Invite revoked');
});

const getInviteInfo = asyncHandler(async (req, res) => {
  const invite = await inviteService.getInviteByToken(req.params.token);
  success(res, invite);
});

const acceptInvite = asyncHandler(async (req, res) => {
  const { token } = req.body;
  const result = await inviteService.acceptInvite(token, req.user.id);
  success(res, result, 'Invite accepted');
});

module.exports = { sendInvite, listInvites, revokeInvite, getInviteInfo, acceptInvite };
