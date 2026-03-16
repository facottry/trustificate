const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Function to compile Handlebars template
const compileTemplate = (templateName, data) => {
  const templatePath = path.join(__dirname, '../templates/emails', `${templateName}.hbs`);
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template ${templateName} not found`);
  }
  const templateSource = fs.readFileSync(templatePath, 'utf8');
  const template = handlebars.compile(templateSource);
  return template(data);
};

const sendVerificationEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.FROM_EMAIL || 'noreply@trustificate.com',
    to: email,
    subject: 'Trustificate - Verify Your Email',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Trustificate!</h2>
        <p>Please verify your email address by entering the following OTP:</p>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0;">
          ${otp}
        </div>
        <p>This OTP will expire in 15 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>Trustificate Team</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const sendPasswordResetEmail = async (email, otp, token, userName) => {
  if (!otp || !token) {
    throw new Error('OTP and token are required for password reset email');
  }

  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/reset-password?token=${token}&email=${email}`;

  const html = compileTemplate('forgot-password', {
    userName: userName || 'User',
    otp,
    resetLink,
  });

  const mailOptions = {
    from: process.env.FROM_EMAIL || 'noreply@trustificate.com',
    to: email,
    subject: 'Trustificate - Reset Your Password',
    html,
  };

  await transporter.sendMail(mailOptions);
};

const sendWelcomeEmail = async (email, userName) => {
  const dashboardLink = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/dashboard`;

  const html = compileTemplate('welcome', {
    userName,
    dashboardLink,
  });

  const mailOptions = {
    from: process.env.FROM_EMAIL || 'noreply@trustificate.com',
    to: email,
    subject: 'Welcome to Trustificate',
    html,
  };

  await transporter.sendMail(mailOptions);
};

const sendCertificateReceiverEmail = async (email, recipientName, issuerName, certificateTitle, certificateLink) => {
  if (!certificateLink) {
    throw new Error('Certificate link is required for receiver email');
  }

  const html = compileTemplate('certificate-receiver', {
    recipientName,
    issuerName,
    certificateTitle,
    certificateLink,
  });

  const mailOptions = {
    from: process.env.FROM_EMAIL || 'noreply@trustificate.com',
    to: email,
    subject: 'Certificate Issued - Trustificate',
    html,
  };

  await transporter.sendMail(mailOptions);
};

const sendCertificateIssuerEmail = async (email, issuerName, recipientName, certificateTitle) => {
  const issuanceLogLink = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/documents`;

  const html = compileTemplate('certificate-issuer', {
    issuerName,
    recipientName,
    certificateTitle,
    issuanceLogLink,
  });

  const mailOptions = {
    from: process.env.FROM_EMAIL || 'noreply@trustificate.com',
    to: email,
    subject: 'Certificate Issued Confirmation - Trustificate',
    html,
  };

  await transporter.sendMail(mailOptions);
};

const sendPasswordChangedEmail = async (email, userName) => {
  const timestamp = new Date().toLocaleString();
  const supportLink = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/contact`;

  const html = compileTemplate('password-changed', {
    userName,
    timestamp,
    supportLink,
  });

  const mailOptions = {
    from: process.env.FROM_EMAIL || 'noreply@trustificate.com',
    to: email,
    subject: 'Password Changed Successfully - Trustificate',
    html,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendCertificateReceiverEmail,
  sendCertificateIssuerEmail,
  sendPasswordChangedEmail,
};