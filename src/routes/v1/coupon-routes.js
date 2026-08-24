const express = require("express");
const CouponController = require("../../controller/coupon-controller");
const AuthenticUser = require("../../middleware/Authentication");

const router = express.Router();
const couponController = new CouponController();

router.post("/", AuthenticUser, couponController.createCoupon.bind(couponController));
router.get("/", AuthenticUser, couponController.getActiveCoupons.bind(couponController));
router.post("/validate", AuthenticUser, couponController.validateCoupon.bind(couponController));

module.exports = router;
