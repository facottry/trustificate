const crypto = require('crypto');
const Subscriber = require('./subscriber.schema');
const User = require('../user/user.schema');
const Newsletter = require('../newsletter/newsletter.schema');
const { sendTransactional } = require('../../services/emailService');
const { AppError } = require('../../middlewares/error.middleware');
const logger = require('../../utils/logger');

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://trustificate.clicktory.in';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const TOKEN_EXPIRY_HOURS = 24;

/**
 * Subscribe an email to the newsletter (double opt-in).
 * Always returns a generic message to prevent email enumeration.
 */
const subscribe = async (email) => {
  const normalised = email.toLowerCase().trim();
  const genericMsg = 'If this email is valid, you will receive a confirmation link shortly.';

  // Check if already a registered user with newsletter enabled
  const existingUser = await User.findOne({ email: normalised, newsletterSubscribed: true });
  if (existingUser) return { message: genericMsg };

  // Check existing subscriber
  const existing = await Subscriber.findOne({ email: normalised });
  if (existing && existing.isConfirmed) return { message: genericMsg };

  const token = crypto.randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  if (existing) {
    existing.confirmationToken = token;
    existing.confirmationExpiry = expiry;
    await existing.save();
  } else {
    await Subscriber.create({
      email: normalised,
      confirmationToken: token,
      confirmationExpiry: expiry,
    });
  }

  // Fire-and-forget confirmation email
  const confirmationLink = `${BACKEND_URL}/api/public/newsletter/confirm/${token}`;
  try {
    await sendTransactional(
      normalised,
      'newsletter-subscription-confirm',
      { confirmationLink, email: normalised },
      'Confirm your newsletter subscription'
    );
  } catch (err) {
    logger.error('Failed to send confirmation email:', err);
  }

  return { message: genericMsg };
};

/**
 * Confirm a subscription via token.
 */
const confirmSubscription = async (token) => {
  const subscriber = await Subscriber.findOne({ confirmationToken: token });
  if (!subscriber) throw new AppError('Invalid confirmation link', 400);
  if (subscriber.isConfirmed) return { alreadyConfirmed: true };
  if (subscriber.confirmationExpiry < new Date()) {
    throw new AppError('Confirmation link has expired', 400);
  }

  subscriber.isConfirmed = true;
  subscriber.confirmedAt = new Date();
  subscriber.confirmationToken = null;
  subscriber.confirmationExpiry = null;
  await subscriber.save();

  return { alreadyConfirmed: false };
};

/**
 * Unsubscribe an email — deletes Subscriber if found, updates User if found.
 */
const unsubscribe = async (email) => {
  const normalised = email.toLowerCase().trim();

  await Subscriber.findOneAndDelete({ email: normalised });
  await User.findOneAndUpdate({ email: normalised }, { newsletterSubscribed: false });
};

/**
 * Cleanup expired unconfirmed subscribers.
 */
const cleanup = async () => {
  const result = await Subscriber.deleteMany({
    isConfirmed: false,
    confirmationExpiry: { $lt: new Date() },
  });
  logger.info(`Subscriber cleanup: deleted ${result.deletedCount} expired unconfirmed records`);
  return result.deletedCount;
};

/**
 * Get all newsletters for public archive (excludes sentBy).
 */
const getPublicNewsletters = async () => {
  return Newsletter.find()
    .sort({ sentAt: -1 })
    .select('subject body slug sentAt recipientCount');
};

/**
 * Get a single newsletter by slug (or _id fallback) for public detail (excludes sentBy).
 */
const getPublicNewsletterBySlug = async (slug) => {
  const mongoose = require('mongoose');
  const fields = 'subject body slug sentAt recipientCount';

  // Try slug first
  let newsletter = await Newsletter.findOne({ slug }).select(fields);

  // Fallback: try by _id (for newsletters created before slug migration)
  if (!newsletter && mongoose.Types.ObjectId.isValid(slug)) {
    newsletter = await Newsletter.findById(slug).select(fields);
  }

  if (!newsletter) throw new AppError('Newsletter not found', 404);
  return newsletter;
};

module.exports = {
  subscribe,
  confirmSubscription,
  unsubscribe,
  cleanup,
  getPublicNewsletters,
  getPublicNewsletterBySlug,
};
