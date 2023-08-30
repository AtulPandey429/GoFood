const Order = require("../model/Order");

const OrderController = async (req, res) => {
  let data = req.body.order_data;
  await data.splice(0, 0, { Order_date: req.body.order_date });
  console.log("1231242343242354", req.body.email);

  // Check if email exists in the database
  let existingOrder = await Order.findOne({ email: req.body.email });

  if (existingOrder === null) {
    try {
      console.log(data);
      console.log("1231242343242354", req.body.email);
      await Order.create({
        email: req.body.email,
        order_data: [data],
      });
      res.json({ success: true });
    } catch (error) {
      console.log(error.message);
      res.status(500).send("Server Error: " + error.message);
    }
  } else {
    try {
      await Order.findOneAndUpdate(
        { email: req.body.email },
        { $push: { order_data: data } }
      );
      res.json({ success: true });
    } catch (error) {
      console.log(error.message);
      res.status(500).send("Server Error: " + error.message);
    }
  }
};

module.exports = { OrderController };
