const express = require('express');
const router = express.Router();
const certificateController = require('./certificate.controller');
const { protect } = require('../../middlewares/auth.middleware');

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
 *     summary: Issue a new certificate
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 */
router.post('/issue', protect, certificateController.issueCertificate);

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
 * /api/public/verify/{certificateNumber}:
 *   get:
 *     summary: Verify a certificate by number (public)
 *     tags: [Certificates]
 *     parameters:
 *       - in: path
 *         name: certificateNumber
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/public/verify/:certificateNumber', certificateController.verifyCertificate);

module.exports = router;
