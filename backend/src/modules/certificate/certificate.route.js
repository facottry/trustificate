const express = require('express');
const router = express.Router();
const multer = require('multer');
const certificateController = require('./certificate.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { enforcePlanLimit } = require('../../middlewares/planEnforcement.middleware');

const pdfUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'));
  },
});

/**
 * @swagger
 * tags:
 *   name: Certificates
 *   description: Certificate issuance and management
 */

/**
 * @swagger
 * /api/certificates/issue:
 *   post:
 *     summary: Issue a new certificate (legacy)
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 */
router.post('/issue', protect, enforcePlanLimit('certificates_created'), certificateController.issueCertificate);

/**
 * @swagger
 * /api/certificates:
 *   post:
 *     summary: Create a new certificate
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', protect, enforcePlanLimit('certificates_created'), certificateController.createCertificate);

/**
 * @swagger
 * /api/certificates:
 *   get:
 *     summary: List certificates in the organization
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', protect, certificateController.listCertificates);

/**
 * @swagger
 * /api/certificates/slug/{slug}:
 *   get:
 *     summary: Get certificate by slug (public)
 *     tags: [Certificates]
 */
router.get('/slug/:slug', certificateController.getCertificateBySlug);

/**
 * @swagger
 * /api/certificates/public/verify/{certificateNumber}:
 *   get:
 *     summary: Verify a certificate by number (public)
 *     tags: [Certificates]
 */
router.get('/public/verify/:certificateNumber', certificateController.verifyCertificate);

/**
 * @swagger
 * /api/certificates/{id}/upload-pdf:
 *   post:
 *     summary: Upload rendered PDF for a certificate
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/upload-pdf', protect, pdfUpload.single('file'), certificateController.uploadPdf);

/**
 * @swagger
 * /api/certificates/{id}:
 *   get:
 *     summary: Get certificate by ID
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', protect, certificateController.getCertificateById);

/**
 * @swagger
 * /api/certificates/{id}:
 *   put:
 *     summary: Update a certificate
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', protect, certificateController.updateCertificate);

/**
 * @swagger
 * /api/certificates/{id}:
 *   delete:
 *     summary: Delete a certificate
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', protect, certificateController.deleteCertificate);

module.exports = router;
