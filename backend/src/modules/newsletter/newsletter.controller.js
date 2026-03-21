const newsletterService = require('./newsletter.service');
const { asyncHandler } = require('../../middlewares/error.middleware');
const { success, error } = require('../../utils/apiResponse');

const polish = asyncHandler(async (req, res) => {
  if (!req.body.draft || !req.body.draft.trim()) {
    return error(res, 'Draft is required', 400);
  }
  try {
    const polishedText = await newsletterService.polishDraft(req.body.draft);
    return success(res, { polishedText });
  } catch (err) {
    return error(res, 'AI assistance is temporarily unavailable', 502);
  }
});

const send = asyncHandler(async (req, res) => {
  const { subject, body } = req.body;
  if (!subject || !subject.trim()) {
    return error(res, 'Subject is required', 400);
  }
  if (!body || !body.trim()) {
    return error(res, 'Body is required', 400);
  }
  success(res, null, 'Newsletter queued for delivery', 202);
  newsletterService.sendNewsletter(subject, body, req.user.id).catch(() => {});
});

const history = asyncHandler(async (req, res) => {
  const data = await newsletterService.getHistory();
  success(res, data);
});

module.exports = { polish, send, history };
