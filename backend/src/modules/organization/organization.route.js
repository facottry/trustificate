const express = require('express');
const router = express.Router();
const orgController = require('./organization.controller');
const { protect } = require('../../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Organizations
 *   description: Organization management
 */

/**
 * @swagger
 * /api/organizations:
 *   post:
 *     summary: Create a new organization
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, slug]
 *             properties:
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               logoUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Organization created
 */
router.post('/', protect, orgController.createOrganization);

/**
 * @swagger
 * /api/organizations:
 *   get:
 *     summary: List organizations the user belongs to
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', protect, orgController.listOrganizations);

/**
 * @swagger
 * /api/organizations/{id}:
 *   get:
 *     summary: Get organization details
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/:id', protect, orgController.getOrganization);

/**
 * @swagger
 * /api/organizations/{id}:
 *   put:
 *     summary: Update an organization
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', protect, orgController.updateOrganization);

/**
 * @swagger
 * /api/organizations/{id}:
 *   delete:
 *     summary: Delete an organization
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', protect, orgController.deleteOrganization);

/**
 * @swagger
 * /api/organizations/{id}/usage:
 *   get:
 *     summary: Get usage and plan information for an organization
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id/usage', protect, orgController.getUsage);

/**
 * @swagger
 * /api/organizations/{id}/usage:
 *   post:
 *     summary: Increment usage counter (internal)
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/usage', protect, orgController.incrementUsage);

module.exports = router;
