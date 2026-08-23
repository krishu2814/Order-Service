const { startConsumer } = require("./event-consumer");
const OrderRepository = require("../repository/order-repository");
const { publishEvent } = require("../config/rabbitmq");

const orderRepository = new OrderRepository();

const initOrderConsumers = async () => {
  await startConsumer(
    "order_inventory_reserved_queue",
    "INVENTORY_RESERVED",
    async (data) => {
      const updatedOrder = await orderRepository.updateOrder(data.orderId, {
        orderStatus: "READY_FOR_PAYMENT",
      });

      if (!updatedOrder) {
        throw new Error(`Order not found: ${data.orderId}`);
      }

      console.log(`Order ready for payment: ${data.orderId}`);
    },
  );

  await startConsumer(
    "order_inventory_failed_queue",
    "INVENTORY_FAILED",
    async (data) => {
      const updatedOrder = await orderRepository.updateOrder(data.orderId, {
        orderStatus: "CANCELLED",
      });

      if (!updatedOrder) {
        throw new Error(`Order not found: ${data.orderId}`);
      }

      console.log(`Order cancelled due to inventory failure: ${data.orderId}`);
    },
  );

  await startConsumer(
    "order_payment_queue",
    "PAYMENT_SUCCESS",
    async (data) => {
      const updatedOrder = await orderRepository.updateOrder(data.orderId, {
        orderStatus: "CONFIRMED",
        paymentStatus: "SUCCESS",
        transactionId: data.transactionId,
      });

      if (!updatedOrder) {
        throw new Error(`Order not found: ${data.orderId}`);
      }

      await publishEvent("ORDER_CONFIRMED", {
        event: "ORDER_CONFIRMED",
        orderId: data.orderId,
        userId: data.userId,
        transactionId: data.transactionId,
        timestamp: new Date().toISOString(),
      });

      console.log(`Order confirmed: ${data.orderId}`);
    },
  );
};

module.exports = initOrderConsumers;
