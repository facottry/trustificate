const express = require('express');
const router = express.Router();
const certificateService = require('../certificate/certificate.service');
const Certificate = require('../certificate/certificate.schema');
const Organization = require('../organization/organization.schema');
const Template = require('../template/template.schema');

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

/**
 * @swagger
 * /api/public/platform-stats:
 *   get:
 *     summary: Get aggregated platform statistics (public, no auth)
 *     tags: [Public]
 */
router.get('/platform-stats', async (req, res) => {
  try {
    const [credentialsIssued, organizations, templates] = await Promise.all([
      Certificate.countDocuments(),
      Organization.countDocuments(),
      Template.countDocuments(),
    ]);
    // Verifications = rough estimate based on certificates (no separate tracking yet)
    const verifications = credentialsIssued * 3;
    res.json({
      success: true,
      data: { credentialsIssued, organizations, verifications, templates },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch platform stats' });
  }
});

/**
 * @swagger
 * /api/public/contact:
 *   post:
 *     summary: Submit a contact form (public, no auth)
 *     tags: [Public]
 */
router.post('/contact', async (req, res) => {
  try {
    const { firstName, lastName, email, company, subject, message } = req.body;
    if (!firstName || !lastName || !email || !message) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const mongoose = require('mongoose');
    // Use a lightweight ad-hoc model
    const Contact = mongoose.models.Contact || mongoose.model('Contact', new mongoose.Schema({
      firstName: String, lastName: String, email: String,
      company: String, subject: String, message: String,
    }, { timestamps: true }));
    await Contact.create({ firstName, lastName, email, company, subject, message });
    res.json({ success: true, message: 'Contact form submitted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to submit contact form' });
  }
});

module.exports = router;
