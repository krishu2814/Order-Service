const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },

    orderNumber: {
      type: String,
      unique: true,
    },

    items: [
      {
        productId: {
          type: mongoose.Schema.Types.Mixed,
          required: true,
        },

        name: {
          type: String,
        },

        quantity: {
          type: Number,
          required: true,
          min: [1, "Quantity must be at least 1"],
        },

        price: {
          type: Number,
          required: true,
        },
      },
    ],

    originalAmount: {
      type: Number,
    },

    discountAmount: {
      type: Number,
      default: 0,
    },

    couponCode: {
      type: String,
      uppercase: true,
      trim: true,
    },

    totalAmount: {
      type: Number,
      required: true,
    },

    orderStatus: {
      type: String,
      enum: [
        "PENDING",
        "READY_FOR_PAYMENT",
        "CONFIRMED",
        "CANCELLED",
        "DELIVERED",
      ],
      default: "PENDING",
      index: true,
    },

    paymentStatus: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "PENDING",
    },

    transactionId: {
      type: String,
    },

    deliveryAddress: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  { timestamps: true },
);

orderSchema.index({ createdAt: -1 });

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
