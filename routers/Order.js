const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const authMiddleware = require("../middleware/authMiddleware");

// Legacy aliases
router.post("/orderdata", authMiddleware, orderController.createOrder);
router.post("/orderData", authMiddleware, orderController.createOrder);
router.post("/myOrder", authMiddleware, orderController.getHistory);

module.exports = router;
