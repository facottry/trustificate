const express = require('express');
const router = express.Router();
const planController = require('./plan.controller');
const { protect } = require('../../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Plans
 *   description: Plan management and coupon validation
 */

/**
 * @swagger
 * /api/coupons/validate:
 *   post:
 *     summary: Validate a coupon code
 *     tags: [Plans]
 *     security:
 *       - bearerAuth: []
 */
router.post('/coupons/validate', protect, planController.validateCoupon);

/**
 * @swagger
 * /api/organizations/{id}/plan:
 *   post:
 *     summary: Upgrade an organization's plan
 *     tags: [Plans]
 *     security:
 *       - bearerAuth: []
 */
router.post('/organizations/:id/plan', protect, planController.upgradePlan);

module.exports = router;
