const OrderRepository = require('../repository/order-repository');
const axios = require('axios');
const { CART_SERVICE_URL, PRODUCT_SERVICE_URL } = require('../config/serverConfig');
const { publishEvent } = require('../config/rabbitmq');

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
        // console.log('Product details:', response.data.data);
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

    async placeOrder(token, userId, deliveryAddress) {

        // 1. Get Cart
        const cart = await this.getCart(token);

        if (!cart || cart.items.length === 0) {
            throw new Error('Cart is empty');
        }

        // 2. Validate products + build order items
        const orderItems = [];

        for (const item of cart.items) {
            const product = await this.getProduct(item.productId);

            if (!product) {
                throw new Error(`Product not found: ${item.productId}`);
            }

            if (product.stock < item.quantity) {
                throw new Error(`Insufficient stock for ${product.name}`);
            }

            orderItems.push({
                productId: product._id,
                name: product.name,
                quantity: item.quantity,
                price: product.price
            });
        }

        // 3. Calculate total
        const totalAmount = this.calculateTotal(orderItems);

        // 4. Create Order
        const order = await this.orderRepository.createOrder({
            userId,
            orderNumber: this.generateOrderNumber(),
            items: orderItems,
            totalAmount,
            deliveryAddress,
            orderStatus: 'PENDING',
            paymentStatus: 'PENDING'
        });
            
        // 5. Publish Event
        await publishEvent('ORDER_CREATED', {
            orderId: order._id,
            userId,
            amount: totalAmount,
            items: orderItems
        });

        // 6. Clear Cart
        await this.clearCart(token);

        // 7. Return Order
        return order;

    }

    async getOrderById(orderId) {
        return await this.orderRepository.getOrderById(orderId);
    }

    async updateOrder(orderId, data) {
        return await this.orderRepository.updateOrder(orderId, data);
    }
}

module.exports = OrderService;
