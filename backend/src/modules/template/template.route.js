const express = require('express');
const router = express.Router();
const templateController = require('./template.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { enforcePlanLimit } = require('../../middlewares/planEnforcement.middleware');
// const multer = require('multer');
// const upload = multer({ dest: 'uploads/' });

/**
 * @swagger
 * tags:
 *   name: Templates
 *   description: Certificate templates
 */

/**
 * @swagger
 * /api/templates:
 *   post:
 *     summary: Create a new template
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', protect, enforcePlanLimit('templates_created'), templateController.createTemplate);

/**
 * @swagger
 * /api/templates:
 *   get:
 *     summary: List templates in the organization
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', protect, templateController.listTemplates);

/**
 * @swagger
 * /api/templates/{id}:
 *   get:
 *     summary: Get a template by id
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', protect, templateController.getTemplate);

/**
 * @swagger
 * /api/templates/{id}:
 *   put:
 *     summary: Update a template
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', protect, templateController.updateTemplate);

/**
 * @swagger
 * /api/templates/{id}:
 *   delete:
 *     summary: Delete a template
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', protect, templateController.deleteTemplate);

/**
 * @swagger
 * /api/templates/upload:
 *   post:
 *     summary: Upload a template PDF
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 */
// router.post('/upload', protect, upload.single('file'), templateController.uploadTemplate);

module.exports = router;
