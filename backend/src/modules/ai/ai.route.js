const express = require('express');
const router = express.Router();
const aiController = require('./ai.controller');
const { protect } = require('../../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: AI
 *   description: AI assistant endpoints
 */

/**
 * @swagger
 * /api/ai/assist:
 *   post:
 *     summary: Get AI-generated suggestions
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 */
router.post('/assist', protect, aiController.assist);

module.exports = router;
