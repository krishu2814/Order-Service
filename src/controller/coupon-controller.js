const CouponService = require("../service/coupon-service");
const { ForbiddenError, BadRequestError } = require("../utils/errors/app-error");

class CouponController {
  constructor() {
    this.couponService = new CouponService();
  }

  async createCoupon(req, res, next) {
    try {
      const userRole = req.user?.role || req.user?.userRole;
      if (userRole !== "admin") {
        throw new ForbiddenError("Forbidden: Only administrators can create coupons", "COUPON_ADMIN_REQUIRED");
      }

      const coupon = await this.couponService.createCoupon(req.body);
      return res.status(201).json({
        success: true,
        data: coupon,
        message: "Coupon created successfully",
        error: {},
      });
    } catch (error) {
      next(error);
    }
  }

  async getActiveCoupons(req, res, next) {
    try {
      const coupons = await this.couponService.getActiveCoupons();
      return res.status(200).json({
        success: true,
        data: coupons,
        message: "Active coupons retrieved successfully",
        error: {},
      });
    } catch (error) {
      next(error);
    }
  }

  async validateCoupon(req, res, next) {
    try {
      const code = req.body.code || req.body.couponCode;
      const amount = req.body.amount || req.body.orderAmount || req.body.totalAmount;
      const userId = req.user?.id || req.user?.userId;

      if (!code) {
        throw new BadRequestError("Coupon code is required", "COUPON_CODE_REQUIRED");
      }

      const result = await this.couponService.validateAndCalculateDiscount(
        code,
        amount,
        userId,
      );

      return res.status(200).json({
        success: true,
        data: result,
        message: result.message,
        error: {},
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CouponController;
