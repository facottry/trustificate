const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const { protect } = require('../../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin operations
 */

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get admin users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/users', protect, adminController.getAdminUsers);

/**
 * @swagger
 * /api/admin/log:
 *   post:
 *     summary: Log admin action
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.post('/log', protect, adminController.logAdminAction);

/**
 * @swagger
 * /api/admin/user-roles:
 *   post:
 *     summary: Assign user role
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.post('/user-roles', protect, adminController.assignUserRole);

/**
 * @swagger
 * /api/admin/user-roles:
 *   get:
 *     summary: List user roles
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/user-roles', protect, adminController.listUserRoles);

module.exports = router;