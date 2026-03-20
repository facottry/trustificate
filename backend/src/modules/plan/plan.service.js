const Coupon = require('../coupon/coupon.schema');
const Order = require('../order/order.schema');
const Organization = require('../organization/organization.schema');
const { getPlan, PLANS } = require('../../utils/planConfig');
const { AppError } = require('../../middlewares/error.middleware');

/**
 * Validate a coupon code.
 * @param {string} code
 * @returns {{ valid: boolean, discount_percent?: number, code?: string, error?: string }}
 */
const validateCoupon = async (code) => {
  if (!code) return { valid: false, error: 'Coupon code is required' };

  const coupon = await Coupon.findOne({ code: code.toUpperCase() });

  if (!coupon || !coupon.isActive) {
    return { valid: false, error: 'Coupon not found or inactive' };
  }

  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return { valid: false, error: 'Coupon has expired' };
  }

  if (coupon.maxUses !== null && coupon.currentUses >= coupon.maxUses) {
    return { valid: false, error: 'Coupon usage limit reached' };
  }

  return { valid: true, discount_percent: coupon.discountPercent, code: coupon.code };
};

/**
 * Upgrade an organization's plan.
 * @param {string} orgId
 * @param {string} userId
 * @param {string} planName
 * @param {string|null} couponCode
 * @returns {Promise<Object>} The created Order document
 */
const upgradePlan = async (orgId, userId, planName, couponCode) => {
  // Validate plan exists and is not 'free'
  if (!PLANS[planName]) {
    throw new AppError(`Invalid plan: ${planName}`, 400, 'INVALID_PLAN');
  }
  if (planName === 'free') {
    throw new AppError('Cannot upgrade to the free plan', 400, 'INVALID_PLAN');
  }

  const planConfig = getPlan(planName);
  const originalPrice = planConfig.price;

  // Validate coupon if provided
  let couponDiscount = 0;
  let appliedCouponCode = null;
  if (couponCode) {
    const couponResult = await validateCoupon(couponCode);
    if (!couponResult.valid) {
      throw new AppError(couponResult.error, 400, 'INVALID_COUPON');
    }
    couponDiscount = couponResult.discount_percent;
    appliedCouponCode = couponResult.code;
  }

  // Calculate pricing
  const discountedPrice = originalPrice - (originalPrice * couponDiscount) / 100;
  const finalAmount = Math.max(0, Math.round(discountedPrice));

  // Create order record
  const order = await Order.create({
    organizationId: orgId,
    userId,
    planName,
    originalPrice,
    discountPercent: couponDiscount,
    discountedPrice: finalAmount,
    couponCode: appliedCouponCode,
    couponDiscountPercent: couponDiscount,
    finalAmount,
    status: 'completed',
  });

  // Update organization plan and billing cycle
  const now = new Date();
  await Organization.findByIdAndUpdate(orgId, {
    plan: planName,
    billingCycleStart: now,
    billingCycleEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
  });

  // Increment coupon usage if one was applied
  if (appliedCouponCode) {
    await Coupon.findOneAndUpdate(
      { code: appliedCouponCode },
      { $inc: { currentUses: 1 } }
    );
  }

  return order;
};

/**
 * Seed default coupons (e.g. FREE_100) if they don't already exist.
 */
const seedDefaultCoupons = async () => {
  const exists = await Coupon.findOne({ code: 'FREE_100' });
  if (!exists) {
    await Coupon.create({
      code: 'FREE_100',
      discountPercent: 100,
      isActive: true,
      maxUses: null,
      currentUses: 0,
      expiresAt: null,
    });
    console.log('  🎟️  Seeded FREE_100 coupon');
  }
};

module.exports = { validateCoupon, upgradePlan, seedDefaultCoupons };
