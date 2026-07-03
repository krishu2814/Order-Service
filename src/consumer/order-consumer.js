const { startConsumer } = require('./event-consumer');
const OrderRepository = require('../repository/order-repository');
const { publishEvent } = require('../config/rabbitmq');

const orderRepository = new OrderRepository();

const initOrderConsumers = async () => {

    /**
     * 1. PAYMENT Service -> ORDER Service (PAYMENT_SUCCESS event)
     * 2. ORDER Service -> publish ORDER_CONFIRMED event to notify other services (like Cart Service, Notification Service, etc.)
     */
    
    await startConsumer('PAYMENT_SUCCESS', async (data) => {
        // console.log('PAYMENT_SUCCESS received:', data);

        const updatedOrder = await orderRepository.updateOrder(data.orderId, {
            orderStatus: 'CONFIRMED',
            paymentStatus: 'SUCCESS',
            transactionId: data.transactionId // sent by Payment Service -> Need transactionId for order record
        });

        if(!updatedOrder) {
            throw new Error(`Order not found for ID: ${data.orderId}`);
        }

        // 2. AFTER ORDER UPDATE → publish next event
        await publishEvent('ORDER_CONFIRMED', {
            event: 'ORDER_CONFIRMED',
            orderId: data.orderId,
            userId: data.userId,
            transactionId: data.transactionId,
            timestamp: new Date().toISOString()
        });

        // console.log('ORDER_CONFIRMED event published');
    });

    
};

module.exports = initOrderConsumers;
