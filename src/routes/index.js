const express = require('express');
const router = express.Router();
const apiV1Routes = require('./v1/index.js');
const couponRoutes = require('./v1/coupon-routes.js');

// Define routes
router.use('/v1/coupons', couponRoutes);
router.use('/v1', apiV1Routes);

module.exports = router;
