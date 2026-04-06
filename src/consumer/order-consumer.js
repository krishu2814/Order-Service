const { startConsumer } = require('./event-consumer');
const OrderRepository = require('../repository/order-repository');

const repo = new OrderRepository();

const initOrderConsumers = async () => {

    await startConsumer('PAYMENT_SUCCESS', async (data) => {
        console.log('PAYMENT_SUCCESS:', data);

        await repo.update(data.orderId, {
            orderStatus: 'CONFIRMED',
            paymentStatus: 'SUCCESS'
        });
    });

    await startConsumer('PAYMENT_FAILED', async (data) => {
        console.log('PAYMENT_FAILED:', data);

        await repo.update(data.orderId, {
            orderStatus: 'CANCELLED',
            paymentStatus: 'FAILED'
        });
    });
};

module.exports = initOrderConsumers;
