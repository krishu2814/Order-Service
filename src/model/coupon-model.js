const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
    },
    discountType: {
      type: String,
      enum: ["PERCENTAGE", "FLAT"],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: [0, "Discount value cannot be negative"],
    },
    minOrderValue: {
      type: Number,
      default: 0,
      min: [0, "Minimum order value cannot be negative"],
    },
    maxDiscountAmount: {
      type: Number, // Cap for percentage discounts (e.g. 20% off up to $50)
    },
    validFrom: {
      type: Date,
      default: Date.now,
    },
    validUntil: {
      type: Date,
      required: true,
    },
    usageLimit: {
      type: Number, // Total times this coupon can be redeemed across all users
      default: 1000,
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    userUsageLimit: {
      type: Number, // Times an individual user can redeem this coupon
      default: 1,
    },
    usedBy: [
      {
        userId: {
          type: String,
          required: true,
        },
        orderId: {
          type: String,
        },
        usedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true },
);

const Coupon = mongoose.model("Coupon", couponSchema);

module.exports = Coupon;
