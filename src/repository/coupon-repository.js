const Coupon = require("../model/coupon-model");

class CouponRepository {
  async createCoupon(data) {
    try {
      return await Coupon.create(data);
    } catch (error) {
      console.error("Error creating coupon in repository:", error.message);
      throw error;
    }
  }

  async getCouponByCode(code) {
    try {
      return await Coupon.findOne({
        code: String(code).trim().toUpperCase(),
      });
    } catch (error) {
      console.error("Error fetching coupon by code:", error.message);
      throw error;
    }
  }

  async getAllActiveCoupons() {
    try {
      const now = new Date();
      return await Coupon.find({
        isActive: true,
        validUntil: { $gte: now },
      }).sort({ createdAt: -1 });
    } catch (error) {
      console.error("Error fetching active coupons:", error.message);
      throw error;
    }
  }

  async incrementUsage(code, userId, orderId) {
    try {
      return await Coupon.findOneAndUpdate(
        { code: String(code).trim().toUpperCase() },
        {
          $inc: { usedCount: 1 },
          $push: {
            usedBy: {
              userId: String(userId),
              orderId: String(orderId),
              usedAt: new Date(),
            },
          },
        },
        { new: true },
      );
    } catch (error) {
      console.error("Error incrementing coupon usage:", error.message);
      throw error;
    }
  }

  async deleteCoupon(id) {
    try {
      return await Coupon.findByIdAndDelete(id);
    } catch (error) {
      console.error("Error deleting coupon:", error.message);
      throw error;
    }
  }
}

module.exports = CouponRepository;
