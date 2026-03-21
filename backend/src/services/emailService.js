'use strict';

const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');

const { AppError } = require('../middlewares/error.middleware');
const logger = require('../utils/logger');

// ---------------------------------------------------------------------------
// Nodemailer transporter (unchanged from original)
// ---------------------------------------------------------------------------
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ---------------------------------------------------------------------------
// Partial registration — runs ONCE at module load
// ---------------------------------------------------------------------------
const PARTIALS_DIR = path.join(__dirname, '../templates/emails/partials');
const PARTIAL_NAMES = ['email-header', 'brand-tokens', 'transactional-footer', 'promotional-footer'];

PARTIAL_NAMES.forEach((name) => {
  const filePath = path.join(PARTIALS_DIR, `${name}.hbs`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Required partial "${name}" not found at ${filePath}`);
  }
  handlebars.registerPartial(name, fs.readFileSync(filePath, 'utf8'));
});

// ---------------------------------------------------------------------------
// compileTemplate(templateName, data) → rendered HTML string
// ---------------------------------------------------------------------------
const compileTemplate = (templateName, data) => {
  const filePath = path.join(__dirname, '../templates/emails', templateName + '.hbs');
  if (!fs.existsSync(filePath)) {
    throw new Error(`Template "${templateName}" not found`);
  }
  const source = fs.readFileSync(filePath, 'utf8');
  const template = handlebars.compile(source);
  return template(data);
};

// ---------------------------------------------------------------------------
// sendTransactional(to, templateName, data, subject) → Promise<void>
// ---------------------------------------------------------------------------
const sendTransactional = async (to, templateName, data, subject) => {
  try {
    const html = compileTemplate(templateName, data);
    await transporter.sendMail({
      from: process.env.FROM_EMAIL || 'noreply@trustificate.com',
      to,
      subject,
      html,
    });
  } catch (err) {
    logger.error('Transactional email error:', err);
    throw new AppError('Failed to send email: ' + err.message, 500);
  }
};

// ---------------------------------------------------------------------------
// sendPromotional(recipients, templateName, data, subject) → Promise<void>
// ---------------------------------------------------------------------------
const sendPromotional = async (recipients, templateName, data, subject) => {
  // Validate unsubscribeLink BEFORE compilation
  if (!data.unsubscribeLink || typeof data.unsubscribeLink !== 'string' || data.unsubscribeLink.trim() === '') {
    throw new AppError('Promotional email requires a non-empty unsubscribeLink', 400);
  }

  try {
    const html = compileTemplate(templateName, data);
    const from = process.env.FROM_EMAIL || 'noreply@trustificate.com';
    for (const recipient of recipients) {
      await transporter.sendMail({ from, to: recipient, subject, html });
    }
  } catch (err) {
    logger.error('Promotional email error:', err);
    throw new AppError('Failed to send promotional email: ' + err.message, 500);
  }
};

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------
module.exports = {
  compileTemplate,
  sendTransactional,
  sendPromotional,
};
