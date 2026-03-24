const Order = require('../model/order-model');

class OrderRepository {

    async createOrder(data) {
        return await Order.create(data);
    }

    async getOrdersByUserId(userId) {
        return await Order.find({ userId }).sort({ createdAt: -1 });
    }

    async getOrderById(orderId) {
        return await Order.findById(orderId);
    }

    async updateOrder(orderId, data) {
        return await Order.findByIdAndUpdate(orderId, data, { new: true });
    }

}

module.exports = OrderRepository;
