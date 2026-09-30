const CouponService = require("../service/coupon-service");

class CouponController {
  constructor() {
    this.couponService = new CouponService();
  }

  async createCoupon(req, res) {
    try {
      const userRole = req.user?.role || req.user?.userRole;
      if (userRole !== "admin") {
        return res.status(403).json({
          success: false,
          data: {},
          message: "Forbidden: Only administrators can create coupons",
          error: "Forbidden",
        });
      }

      const coupon = await this.couponService.createCoupon(req.body);
      return res.status(201).json({
        success: true,
        data: coupon,
        message: "Coupon created successfully",
        error: {},
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        data: {},
        message: "Failed to create coupon",
        error: error.message,
      });
    }
  }

  async getActiveCoupons(req, res) {
    try {
      const coupons = await this.couponService.getActiveCoupons();
      return res.status(200).json({
        success: true,
        data: coupons,
        message: "Active coupons retrieved successfully",
        error: {},
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        data: [],
        message: "Failed to retrieve coupons",
        error: error.message,
      });
    }
  }

  async validateCoupon(req, res) {
    try {
      const code = req.body.code || req.body.couponCode;
      const amount = req.body.amount || req.body.orderAmount || req.body.totalAmount;
      const userId = req.user?.id || req.user?.userId;

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
      return res.status(400).json({
        success: false,
        data: {},
        message: error.message,
        error: error.message,
      });
    }
  }
}

module.exports = CouponController;
