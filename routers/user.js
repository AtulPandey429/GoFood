const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");
const { validateNotifications } = require("../middleware/validation");

router.put("/notifications", authMiddleware, validateNotifications, userController.updateNotifications);
router.post("/notifications/test", authMiddleware, userController.testNotification);

module.exports = router;
