const express = require("express");
const Routes = express.Router();
const Order = require("../model/Order");
const { OrderController } = require("../controllers/OrderCont");
Routes.post("/orderdata", OrderController);
Routes.post("/myOrder", async (req, res) => {
  try {
    let myData = await Order.findOne({ email: req.body.email });
    res.json({ orderData: myData });
  } catch (error) {
    res.send("error mesg", error.message);
  }
});
module.exports = Routes;
