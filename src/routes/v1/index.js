const express = require('express');
const router = express.Router();

const OrderController = require('../../controller/order-controller');
const orderController = new OrderController();

router.post('/orders/place', orderController.placeOrder.bind(orderController));

module.exports = router;
