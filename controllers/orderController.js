const asyncHandler = require("express-async-handler");
const orderService = require("../services/orderService");

exports.createOrder = asyncHandler(async (req, res) => {
  const result = await orderService.createOrder(req.user.id, req.body);
  res.json(result);
});

exports.getHistory = asyncHandler(async (req, res) => {
  const result = await orderService.getOrderHistory(req.user.id);
  res.json(result);
});

exports.getOrderById = asyncHandler(async (req, res) => {
  const result = await orderService.getOrderById(req.user.id, req.params.orderId);
  res.json(result);
});
