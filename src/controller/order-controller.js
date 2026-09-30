const OrderService = require("../service/order-service");

class OrderController {
  constructor() {
    this.orderService = new OrderService();
  }

  async placeOrder(req, res) {
    try {
      const token = req.headers.authorization;
      const userId = req.user.id || req.user.userId;

      const rawAddress = req.body.deliveryAddress || req.body.shippingAddress;
      const deliveryAddress =
        typeof rawAddress === "object" && rawAddress !== null
          ? `${rawAddress.fullName ? rawAddress.fullName + ", " : ""}${rawAddress.address || ""}, ${rawAddress.city || ""}, ${rawAddress.state || ""} ${rawAddress.postalCode || ""}, ${rawAddress.country || ""}`.trim()
          : String(rawAddress || "Standard Delivery");

      const order = await this.orderService.placeOrder(
        token,
        userId,
        deliveryAddress,
        req.body.couponCode,
        req.body.items,
      );

      res.status(201).json({
        success: true,
        data: order,
        message: "Order placed successfully. Complete the payment to proceed",
        error: {},
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        data: {},
        message: "Failed to place order",
        error: error.message,
      });
    }
  }

  async getOrderById(req, res) {
    try {
      const orderId = req.params.id;
      const order = await this.orderService.getOrderById(orderId);

      if (!order) {
        return res.status(404).json({
          success: false,
          data: {},
          message: "Order not found",
          error: {},
        });
      }

      res.status(200).json({
        success: true,
        data: order,
        message: "Order retrieved successfully",
        error: {},
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        data: {},
        message: "Failed to retrieve order",
        error: error.message,
      });
    }
  }

  async getUserOrders(req, res) {
    try {
      const userId = req.user.id || req.user.userId;
      const orders = await this.orderService.getUserOrders(userId);

      return res.status(200).json({
        success: true,
        data: orders,
        message: "Orders retrieved successfully",
        error: {},
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        data: {},
        message: "Failed to retrieve orders",
        error: error.message,
      });
    }
  }

  async cancelOrder(req, res) {
    try {
      const orderId = req.params.id;
      const userId = req.user.id || req.user.userId;

      const order = await this.orderService.cancelOrder(orderId, userId);

      return res.status(200).json({
        success: true,
        data: order,
        message: "Order cancelled successfully",
        error: {},
      });
    } catch (error) {
      const isNotFound = error.message.includes("not found");
      const isForbidden =
        error.message.includes("Unauthorized") ||
        error.message.includes("permission");
      const statusCode = isNotFound ? 404 : isForbidden ? 403 : 400;

      return res.status(statusCode).json({
        success: false,
        data: {},
        message: "Failed to cancel order",
        error: error.message,
      });
    }
  }
}

module.exports = OrderController;
