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

const sendVerificationLinkEmail = async (email, token, userName) => {
  const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/confirm-email?token=${token}`;

  const mailOptions = {
    from: process.env.FROM_EMAIL || 'noreply@trustificate.com',
    to: email,
    subject: 'Trustificate - Verify Your Email',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">Welcome to Trustificate!</h1>
        </div>
        <div style="padding: 40px 30px;">
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Hi ${userName},</p>
          <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 30px;">
            Thank you for signing up! Please verify your email address by clicking the button below to get started with Trustificate.
          </p>
          <div style="text-align: center; margin: 40px 0;">
            <a href="${verificationLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 40px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block;">
              Verify Email
            </a>
          </div>
          <p style="font-size: 14px; color: #999; line-height: 1.6; margin-top: 30px;">
            This verification link will expire in 24 hours.
          </p>
          <p style="font-size: 14px; color: #999;">
            If you didn't sign up for this account, please ignore this email.
          </p>
        </div>
        <div style="background-color: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
          <p style="margin: 0; font-size: 12px; color: #999;">Best regards,<br><strong>Trustificate Team</strong></p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const sendTeamInviteEmail = async (email, orgName, inviterName, joinLink) => {
  const html = compileTemplate('team-invite', { orgName, inviterName, joinLink });

  const mailOptions = {
    from: process.env.FROM_EMAIL || 'noreply@trustificate.com',
    to: email,
    subject: `You've been invited to join ${orgName} on Trustificate`,
    html,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendVerificationEmail,
  sendVerificationLinkEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendCertificateReceiverEmail,
  sendCertificateIssuerEmail,
  sendPasswordChangedEmail,
  sendTeamInviteEmail,
};