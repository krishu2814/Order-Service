const express = require("express");
const router = express.Router();

const OrderController = require("../../controller/order-controller");
const AuthenticUser = require("../../middleware/Authentication");
const orderController = new OrderController();

router.post(
  "/",
  AuthenticUser,
  orderController.placeOrder.bind(orderController),
);
router.get(
  "/",
  AuthenticUser,
  orderController.getUserOrders.bind(orderController),
);
router.get(
  "/:id",
  AuthenticUser,
  orderController.getOrderById.bind(orderController),
);
router.post(
  "/:id/cancel",
  AuthenticUser,
  orderController.cancelOrder.bind(orderController),
);

module.exports = router;
