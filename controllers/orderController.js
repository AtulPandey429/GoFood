const asyncHandler = require("express-async-handler");
const orderService = require("../services/orderService");

exports.createOrder = asyncHandler(async (req, res) => {
  const result = await orderService.createOrder(req.user.email, req.body);
  res.json(result);
});

exports.getHistory = asyncHandler(async (req, res) => {
  const result = await orderService.getOrderHistory(req.user.email);
  res.json(result);
});
