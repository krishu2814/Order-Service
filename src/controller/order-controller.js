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

}

module.exports = OrderController;
