const express = require('express');
const router = express.Router();

const OrderController = require('../../controller/order-controller');
const orderController = new OrderController();

router.post('/', orderController.placeOrder.bind(orderController));
router.get('/:id', orderController.getOrderById.bind(orderController));
/**
 * Now will not allow updating order directly from API, as it should be done via events from Payment Service
 */
// router.patch('/:id', orderController.updateOrder.bind(orderController));

module.exports = router;
