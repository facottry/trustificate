const planService = require('./plan.service');
const { asyncHandler } = require('../../middlewares/error.middleware');
const { success } = require('../../utils/apiResponse');

const validateCoupon = asyncHandler(async (req, res) => {
  const { code } = req.body;
  const result = await planService.validateCoupon(code);
  success(res, result);
});

const upgradePlan = asyncHandler(async (req, res) => {
  const { plan, couponCode } = req.body;
  const orgId = req.params.id;
  const userId = req.user._id;
  const order = await planService.upgradePlan(orgId, userId, plan, couponCode);
  success(res, order, 'Plan upgraded successfully');
});

module.exports = { validateCoupon, upgradePlan };
