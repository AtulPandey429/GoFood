const asyncHandler = require("express-async-handler");
const adminService = require("../services/adminService");

exports.getStats = asyncHandler(async (req, res) => {
  const stats = await adminService.getStats();
  res.json({ success: true, ...stats });
});

exports.getOrders = asyncHandler(async (req, res) => {
  const orders = await adminService.getOrders();
  res.json({ success: true, orders });
});

exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { deliveryStatus } = req.body;
  const result = await adminService.updateOrderStatus(req.params.orderId, deliveryStatus);
  res.json({ success: true, result });
});

exports.getUsers = asyncHandler(async (req, res) => {
  const users = await adminService.getUsers();
  res.json({ success: true, users });
});

exports.getFoodItems = asyncHandler(async (req, res) => {
  const data = await adminService.getFoodItems();
  res.json({ success: true, ...data });
});

exports.createFoodItem = asyncHandler(async (req, res) => {
  const item = await adminService.createFoodItem(req.body);
  res.json({ success: true, item });
});

exports.updateFoodItem = asyncHandler(async (req, res) => {
  const item = await adminService.updateFoodItem(req.params.id, req.body);
  res.json({ success: true, item });
});

exports.deleteFoodItem = asyncHandler(async (req, res) => {
  await adminService.deleteFoodItem(req.params.id);
  res.json({ success: true });
});

exports.getMenuAgentStatus = asyncHandler(async (req, res) => {
  res.json({ success: true, ...adminService.getMenuAgentStatus() });
});

exports.suggestMenuItem = asyncHandler(async (req, res) => {
  const result = await adminService.suggestMenuItem(req.body.prompt);
  res.json({ success: true, ...result });
});

exports.createMenuItemFromPrompt = asyncHandler(async (req, res) => {
  if (req.body.item) {
    const item = await adminService.createFoodItem(req.body.item);
    return res.json({ success: true, item, source: "manual" });
  }
  const result = await adminService.createMenuItemFromPrompt(req.body.prompt);
  res.json({ success: true, ...result, source: "agent" });
});
