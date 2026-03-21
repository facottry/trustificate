const express = require('express');
const inviteController = require('./invite.controller');
const { protect, restrictTo } = require('../../middlewares/auth.middleware');

// Org-scoped router — mounted at /api/organizations/:orgId/invites
const orgRouter = express.Router({ mergeParams: true });

/**
 * @swagger
 * /api/organizations/{orgId}/invites:
 *   post:
 *     summary: Send a team invite (Enterprise plan only)
 *     tags: [Invites]
 *     security:
 *       - bearerAuth: []
 */
orgRouter.post('/', protect, restrictTo('admin'), inviteController.sendInvite);

/**
 * @swagger
 * /api/organizations/{orgId}/invites:
 *   get:
 *     summary: List all invites for an organization
 *     tags: [Invites]
 *     security:
 *       - bearerAuth: []
 */
orgRouter.get('/', protect, restrictTo('admin'), inviteController.listInvites);

/**
 * @swagger
 * /api/organizations/{orgId}/invites/{inviteId}/revoke:
 *   patch:
 *     summary: Revoke a pending invite
 *     tags: [Invites]
 *     security:
 *       - bearerAuth: []
 */
orgRouter.patch('/:inviteId/revoke', protect, restrictTo('admin'), inviteController.revokeInvite);

// Public invite router — mounted at /api/invites
const publicRouter = express.Router();

/**
 * @swagger
 * /api/invites/{token}:
 *   get:
 *     summary: Get invite details by token (public)
 *     tags: [Invites]
 */
publicRouter.get('/:token', inviteController.getInviteInfo);

/**
 * @swagger
 * /api/invites/accept:
 *   post:
 *     summary: Accept an invite (authenticated)
 *     tags: [Invites]
 *     security:
 *       - bearerAuth: []
 */
publicRouter.post('/accept', protect, inviteController.acceptInvite);

module.exports = { orgRouter, publicRouter };
