const OrderRepository = require("../repository/order-repository");
const CouponService = require("./coupon-service");
const axios = require("axios");
const {
  CART_SERVICE_URL,
  PRODUCT_SERVICE_URL,
} = require("../config/serverConfig");
const { publishEvent } = require("../config/rabbitmq");

class OrderService {
  constructor() {
    this.orderRepository = new OrderRepository();
    this.couponService = new CouponService();
  }

  generateOrderNumber() {
    return `ORD-${Date.now()}`;
  }

  calculateTotal(items) {
    return items.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);
  }

  async getCart(token) {
    const response = await axios.get(`${CART_SERVICE_URL}/api/v1/cart`, {
      headers: {
        Authorization: token,
      },
    });

    return response.data.data;
  }

  async getProduct(productId) {
    const response = await axios.get(
      `${PRODUCT_SERVICE_URL}/api/v1/${productId}`,
    );

    return response.data.data;
  }

  async placeOrder(token, userId, deliveryAddress, couponCode = null, clientItems = null) {
    let itemsToProcess = [];
    if (Array.isArray(clientItems) && clientItems.length > 0) {
      itemsToProcess = clientItems;
    } else {
      try {
        const cart = await this.getCart(token);
        if (cart && Array.isArray(cart.items) && cart.items.length > 0) {
          itemsToProcess = cart.items;
        }
      } catch (err) {
        // Fallback if cart service is not available
      }
    }

    if (!itemsToProcess || itemsToProcess.length === 0) {
      throw new Error("Cart is empty");
    }

    const orderItems = [];

    for (const item of itemsToProcess) {
      let product = null;
      try {
        product = await this.getProduct(item.productId);
      } catch (err) {
        if (item.name && item.price) {
          product = {
            _id: item.productId,
            name: item.name,
            price: item.price,
          };
        }
      }

      if (!product) {
        if (item.name && item.price) {
          product = {
            _id: item.productId,
            name: item.name,
            price: item.price,
          };
        } else {
          throw new Error(`Product not found: ${item.productId}`);
        }
      }

      orderItems.push({
        productId: product._id || item.productId,
        name: product.name,
        quantity: item.quantity,
        price: product.price,
      });
    }

    const originalTotal = this.calculateTotal(orderItems);
    let finalTotal = originalTotal;
    let discountAmount = 0;
    let appliedCoupon = null;

    if (couponCode) {
      const discountResult = await this.couponService.validateAndCalculateDiscount(
        couponCode,
        originalTotal,
        userId,
      );
      if (discountResult.isValid) {
        discountAmount = discountResult.discountAmount;
        finalTotal = discountResult.finalAmount;
        appliedCoupon = discountResult.couponCode;
      }
    }

    const order = await this.orderRepository.createOrder({
      userId,
      orderNumber: this.generateOrderNumber(),
      items: orderItems,
      originalAmount: originalTotal,
      discountAmount,
      couponCode: appliedCoupon,
      totalAmount: finalTotal,
      deliveryAddress,
      orderStatus: "PENDING",
      paymentStatus: "PENDING",
    });

    await publishEvent("ORDER_CREATED", {
      event: "ORDER_CREATED",
      orderId: order._id,
      userId,
      amount: finalTotal,
      items: orderItems,
    });

    return order;
  }

  async getOrderById(orderId) {
    return await this.orderRepository.getOrderById(orderId);
  }

  async getUserOrders(userId) {
    return await this.orderRepository.getOrdersByUserId(userId);
  }

  async cancelOrder(orderId, userId) {
    const order = await this.orderRepository.getOrderById(orderId);

    if (!order) {
      throw new Error("Order not found");
    }

    if (String(order.userId) !== String(userId)) {
      throw new Error("Unauthorized: You do not have permission to cancel this order");
    }

    if (order.orderStatus === "CANCELLED") {
      return order; // idempotent
    }

    if (order.orderStatus === "CONFIRMED" || order.orderStatus === "DELIVERED") {
      throw new Error(`Cannot cancel order in ${order.orderStatus} status`);
    }

    const updatedOrder = await this.orderRepository.updateOrder(orderId, {
      orderStatus: "CANCELLED",
      paymentStatus: order.paymentStatus === "SUCCESS" ? "REFUNDED" : "CANCELLED",
    });

    await publishEvent("ORDER_CANCELLED", {
      event: "ORDER_CANCELLED",
      orderId: order._id,
      userId: order.userId,
      items: order.items,
      timestamp: new Date().toISOString(),
    });

    return updatedOrder;
  }
}

module.exports = OrderService;
