const express = require('express');
const router = express.Router();
const certificateService = require('../certificate/certificate.service');

/**
 * @swagger
 * tags:
 *   name: Public
 *   description: Public endpoints (no auth required)
 */

/**
 * @swagger
 * /api/public/verify/{certificateNumber}:
 *   get:
 *     summary: Verify a certificate by number (public)
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: certificateNumber
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/verify/:certificateNumber', async (req, res) => {
  try {
    const cert = await certificateService.getCertificateByNumber(req.params.certificateNumber);
    res.json({ success: true, data: cert });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
});

module.exports = router;
