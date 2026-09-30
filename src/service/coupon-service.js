const CouponRepository = require("../repository/coupon-repository");

class CouponService {
  constructor() {
    this.couponRepository = new CouponRepository();
  }

  async createCoupon(data) {
    if (!data.code || !data.discountType || data.discountValue === undefined || !data.validUntil) {
      throw new Error("Missing required coupon fields: code, discountType, discountValue, validUntil");
    }

    const existing = await this.couponRepository.getCouponByCode(data.code);
    if (existing) {
      throw new Error(`Coupon with code ${data.code.toUpperCase()} already exists`);
    }

    return await this.couponRepository.createCoupon({
      ...data,
      code: data.code.trim().toUpperCase(),
    });
  }

  async getActiveCoupons() {
    return await this.couponRepository.getAllActiveCoupons();
  }

  async validateAndCalculateDiscount(code, originalAmount, userId) {
    if (!code) {
      return {
        isValid: false,
        discountAmount: 0,
        finalAmount: originalAmount,
        message: "No coupon code provided",
      };
    }

    const coupon = await this.couponRepository.getCouponByCode(code);
    if (!coupon) {
      throw new Error(`Invalid coupon code: ${code}`);
    }

    if (!coupon.isActive) {
      throw new Error("This coupon is currently inactive");
    }

    const now = new Date();
    if (coupon.validFrom && now < new Date(coupon.validFrom)) {
      throw new Error("This coupon is not active yet");
    }

    if (now > new Date(coupon.validUntil)) {
      throw new Error("This coupon has expired");
    }

    if (coupon.usedCount >= coupon.usageLimit) {
      throw new Error("Coupon global redemption limit has been reached");
    }

    if (userId) {
      const userRedemptions = coupon.usedBy.filter(
        (entry) => String(entry.userId) === String(userId),
      ).length;

      if (userRedemptions >= coupon.userUsageLimit) {
        throw new Error(
          `You have already redeemed this coupon the maximum allowed times (${coupon.userUsageLimit})`,
        );
      }
    }

    const amount = Number(originalAmount || 0);
    if (amount < coupon.minOrderValue) {
      throw new Error(
        `Minimum order amount of $${coupon.minOrderValue.toFixed(2)} is required to apply this coupon`,
      );
    }

    let discountAmount = 0;
    if (coupon.discountType === "PERCENTAGE") {
      discountAmount = (amount * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
      }
    } else if (coupon.discountType === "FLAT") {
      discountAmount = Math.min(coupon.discountValue, amount);
    }

    discountAmount = Math.round(discountAmount * 100) / 100;
    const finalAmount = Math.max(0, Math.round((amount - discountAmount) * 100) / 100);

    return {
      isValid: true,
      couponCode: coupon.code,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountPercent: coupon.discountType === "PERCENTAGE" ? coupon.discountValue : 0,
      discountAmount,
      originalAmount: amount,
      finalAmount,
      message: `Coupon ${coupon.code} applied successfully! You saved $${discountAmount.toFixed(2)}`,
    };
  }

  async recordCouponUsage(code, userId, orderId) {
    if (!code) return null;
    return await this.couponRepository.incrementUsage(code, userId, orderId);
  }
}

module.exports = CouponService;
