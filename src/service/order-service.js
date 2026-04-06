const OrderRepository = require('../repository/order-repository');
const axios = require('axios');
const { CART_SERVICE_URL, PRODUCT_SERVICE_URL } = require('../config/serverConfig');

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
        const response = await axios.get(
            `${CART_SERVICE_URL}/api/v1/cart`,
            {
                headers: { Authorization: token }
            }
        );
        return response.data.data;
    }

    async getProduct(productId) {
        const response = await axios.get(
            `${PRODUCT_SERVICE_URL}/api/v1/products/${productId}`
        );
        return response.data.data;
    }

    async clearCart(token) {
        await axios.delete(
            `${CART_SERVICE_URL}/api/v1/cart`,
            {
                headers: { Authorization: token }
            }
        );
    }

    async placeOrder(orderData) {
        // Here you can add any business logic related to placing an order, such as validating the order data, calculating total amount, etc.
        
    }
}

module.exports = OrderService;
