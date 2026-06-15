const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

router.use(authMiddleware, adminMiddleware);

router.get("/stats", adminController.getStats);
router.get("/orders", adminController.getOrders);
router.patch("/orders/:orderId/status", adminController.updateOrderStatus);
router.get("/users", adminController.getUsers);
router.get("/food-items", adminController.getFoodItems);
router.post("/food-items", adminController.createFoodItem);
router.put("/food-items/:id", adminController.updateFoodItem);
router.delete("/food-items/:id", adminController.deleteFoodItem);

module.exports = router;
