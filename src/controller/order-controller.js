const OrderService = require("../service/order-service");
const { NotFoundError } = require("../utils/errors/app-error");

class OrderController {
  constructor() {
    this.orderService = new OrderService();
  }

  async placeOrder(req, res, next) {
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

      return res.status(201).json({
        success: true,
        data: order,
        message: "Order placed successfully. Complete the payment to proceed",
        error: {},
      });
    } catch (error) {
      next(error);
    }
  }

  async getOrderById(req, res, next) {
    try {
      const orderId = req.params.id;
      const order = await this.orderService.getOrderById(orderId);

      if (!order) {
        throw new NotFoundError(`Order not found with ID: ${orderId}`, "ORDER_NOT_FOUND");
      }

      return res.status(200).json({
        success: true,
        data: order,
        message: "Order retrieved successfully",
        error: {},
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserOrders(req, res, next) {
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
      next(error);
    }
  }

  async cancelOrder(req, res, next) {
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
      next(error);
    }
  }
}

module.exports = OrderController;
