const { asyncHandler } = require('../../middlewares/error.middleware');
const { success, error } = require('../../utils/apiResponse');
const subscriberService = require('./subscriber.service');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';

/** POST /api/public/newsletter/subscribe */
const subscribe = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string' || !/\S+@\S+\.\S+/.test(email.trim())) {
    return error(res, 'A valid email address is required', 400);
  }
  const result = await subscriberService.subscribe(email);
  success(res, null, result.message);
});

/** GET /api/public/newsletter/confirm/:token */
const confirm = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const result = await subscriberService.confirmSubscription(token);
  if (result.alreadyConfirmed) {
    return res.redirect(`${FRONTEND_URL}/newsletter/confirm?status=already`);
  }
  res.redirect(`${FRONTEND_URL}/newsletter/confirm?status=success`);
});

/** GET /api/public/newsletter/unsubscribe/:email */
const unsubscribe = asyncHandler(async (req, res) => {
  const { email } = req.params;
  await subscriberService.unsubscribe(email);
  res.redirect(`${FRONTEND_URL}/newsletter/unsubscribed`);
});

/** GET /api/public/newsletter — public archive list */
const list = asyncHandler(async (req, res) => {
  const newsletters = await subscriberService.getPublicNewsletters();
  success(res, newsletters, 'Newsletters retrieved');
});

/** GET /api/public/newsletter/:slug — public archive detail */
const detail = asyncHandler(async (req, res) => {
  const newsletter = await subscriberService.getPublicNewsletterBySlug(req.params.slug);
  success(res, newsletter, 'Newsletter retrieved');
});

module.exports = { subscribe, confirm, unsubscribe, list, detail };
