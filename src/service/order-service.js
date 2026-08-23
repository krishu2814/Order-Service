const OrderRepository = require("../repository/order-repository");
const axios = require("axios");
const {
  CART_SERVICE_URL,
  PRODUCT_SERVICE_URL,
} = require("../config/serverConfig");
const { publishEvent } = require("../config/rabbitmq");

class OrderService {
  constructor() {
    this.orderRepository = new OrderRepository();
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

    // console.log("Product details:", response.data.data);

    return response.data.data;
  }

  async placeOrder(token, userId, deliveryAddress) {
    const cart = await this.getCart(token);

    if (!cart || cart.items.length === 0) {
      throw new Error("Cart is empty");
    }

    const orderItems = [];

    for (const item of cart.items) {
      const product = await this.getProduct(item.productId);

      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }

      orderItems.push({
        productId: product._id,
        name: product.name,
        quantity: item.quantity,
        price: product.price,
      });
    }

    const totalAmount = this.calculateTotal(orderItems);

    const order = await this.orderRepository.createOrder({
      userId,
      orderNumber: this.generateOrderNumber(),
      items: orderItems,
      totalAmount,
      deliveryAddress,
      orderStatus: "PENDING",
      paymentStatus: "PENDING",
    });

    await publishEvent("ORDER_CREATED", {
      event: "ORDER_CREATED",
      orderId: order._id,
      userId,
      amount: totalAmount,
      items: orderItems,
    });

    return order;
  }

  async getOrderById(orderId) {
    return await this.orderRepository.getOrderById(orderId);
  }
}

module.exports = OrderService;
