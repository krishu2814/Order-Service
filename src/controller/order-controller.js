const OrderService = require('../service/order-service');

class OrderController {

    constructor() {
        this.orderService = new OrderService();
    }

    async placeOrder(req, res) {
        try {
            const token = req.headers.authorization;
            console.log('Received Token:', token);
            const userId = req.body.userId;
            console.log('User ID from Token:', userId);

            const order = await this.orderService.placeOrder(
                token,
                userId,
                req.body.deliveryAddress
            );
            console.log('Order Placed:', order);

            res.status(201).json({
                success: true,
                data: order,
                message: 'Order placed successfully . Complete the payment to proceed',
                error: {}
            });

        } catch (error) {
            console.error('Error placing order:', error.message);
            res.status(400).json({
                success: false,
                data: {},
                message: 'Failed to place order',
                error: error.message
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
                    message: 'Order not found',
                    error: {}
                });
            }

            res.status(200).json({
                success: true,
                data: order,
                message: 'Order retrieved successfully',
                error: {}
            });

        } catch (error) {
            console.error('Error retrieving order:', error.message);
            res.status(400).json({
                success: false,
                data: {},
                message: 'Failed to retrieve order',
                error: error.message
            });
        }
    }

    async updateOrder(req, res) {
        try {
            const orderId = req.params.id;
            const updateData = req.body;

            const updatedOrder = await this.orderService.updateOrder(orderId, updateData);

            if (!updatedOrder) {
                return res.status(404).json({
                    success: false,
                    data: {},
                    message: 'Order not found',
                    error: {}
                });
            }

            res.status(200).json({
                success: true,
                data: updatedOrder,
                message: 'Order updated successfully',
                error: {}
            });

        } catch (error) {
            console.error('Error updating order:', error.message);
            res.status(400).json({
                success: false,
                data: {},
                message: 'Failed to update order',
                error: error.message
            });
        }
    }
}

module.exports = OrderController;
