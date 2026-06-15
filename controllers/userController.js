const asyncHandler = require("express-async-handler");
const UserRepository = require("../repositories/UserRepository");
const notificationService = require("../services/notificationService");
const { sanitizeUserNotifications } = require("../utils/securityValidators");

exports.updateNotifications = asyncHandler(async (req, res) => {
  const sanitized = sanitizeUserNotifications(req.body);
  const current = await UserRepository.findById(req.user.id);
  if (!current) {
    return res.status(404).json({ success: false, message: "User not found" });
  }
  const user = await UserRepository.updateById(req.user.id, {
    notifications: {
      ...UserRepository.toPlainNotifications(current.notifications),
      ...sanitized,
    },
  });
  res.json({ success: true, user: UserRepository.toSafeUser(user) });
});

exports.testNotification = asyncHandler(async (req, res) => {
  const user = await UserRepository.findById(req.user.id);
  const channel = req.body.channel || "console";
  const result = await notificationService.testNotification(user, channel);
  res.json({ success: true, ...result });
});
