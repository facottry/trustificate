const express = require('express');
const router = express.Router();
const multer = require('multer');
const templateController = require('./template.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { enforcePlanLimit } = require('../../middlewares/planEnforcement.middleware');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

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
 * /api/templates/assets/upload:
 *   post:
 *     summary: Upload a template asset (signature or seal image) to R2
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 */
router.post('/assets/upload', protect, upload.single('file'), templateController.uploadAsset);

module.exports = router;
