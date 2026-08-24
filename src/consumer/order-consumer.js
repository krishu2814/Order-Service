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

      if (updatedOrder.couponCode) {
        const CouponService = require("../service/coupon-service");
        const couponService = new CouponService();
        await couponService.recordCouponUsage(
          updatedOrder.couponCode,
          updatedOrder.userId,
          updatedOrder._id,
        );
      }

      await publishEvent("ORDER_CONFIRMED", {
        event: "ORDER_CONFIRMED",
        orderId: data.orderId,
        userId: data.userId || updatedOrder.userId,
        transactionId: data.transactionId,
        totalAmount: updatedOrder.totalAmount,
        deliveryAddress: updatedOrder.deliveryAddress,
        items: updatedOrder.items,
        timestamp: new Date().toISOString(),
      });

      console.log(`Order confirmed: ${data.orderId}`);
    },
  );

  await startConsumer(
    "order_payment_failed_queue",
    "PAYMENT_FAILED",
    async (data) => {
      const updatedOrder = await orderRepository.updateOrder(data.orderId, {
        orderStatus: "CANCELLED",
        paymentStatus: "FAILED",
      });

      if (!updatedOrder) {
        console.warn(`Order not found for PAYMENT_FAILED: ${data.orderId}`);
        return;
      }

      await publishEvent("ORDER_CANCELLED", {
        event: "ORDER_CANCELLED",
        orderId: data.orderId,
        userId: updatedOrder.userId,
        reason: data.reason || "Payment transaction was declined",
        timestamp: new Date().toISOString(),
      });

      console.log(`[Order Service] Order ${data.orderId} marked CANCELLED due to PAYMENT_FAILED`);
    },
  );

  await startConsumer(
    "order_reservation_expired_queue",
    "RESERVATION_EXPIRED",
    async (data) => {
      const existingOrder = await orderRepository.getOrderById(data.orderId);

      if (!existingOrder) {
        console.warn(`Order not found for RESERVATION_EXPIRED: ${data.orderId}`);
        return;
      }

      // Only cancel if order is still PENDING or READY_FOR_PAYMENT
      if (
        existingOrder.orderStatus === "PENDING" ||
        existingOrder.orderStatus === "READY_FOR_PAYMENT"
      ) {
        await orderRepository.updateOrder(data.orderId, {
          orderStatus: "CANCELLED",
        });

        await publishEvent("ORDER_CANCELLED", {
          event: "ORDER_CANCELLED",
          orderId: data.orderId,
          userId: existingOrder.userId,
          reason: "Order payment window expired (15 minutes limit)",
          timestamp: new Date().toISOString(),
        });

        console.log(`[Order Service] Order ${data.orderId} marked CANCELLED due to RESERVATION_EXPIRED`);
      }
    },
  );
};

module.exports = initOrderConsumers;
