const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const authMiddleware = require("../middleware/authMiddleware");
const { validateOrder } = require("../middleware/validation");

router.post("/", authMiddleware, validateOrder, orderController.createOrder);
router.post("/history", authMiddleware, orderController.getHistory);
router.get("/:orderId", authMiddleware, orderController.getOrderById);

module.exports = router;
