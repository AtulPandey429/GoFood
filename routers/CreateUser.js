const express = require("express");
const Routes = express.Router();
const Order = require("../model/Order");
const { CreateContacts, LoginUser } = require("../controllers/editContact"); // Import controller functions

const { validateContactData } = require("../middleware/validation");

// Route for user signup
Routes.post("/signup", validateContactData, CreateContacts);

// Route for user login
Routes.post("/login", LoginUser);
// Routes.post("/orderData", 
// async (req, res) => {
//   let data = req.body.order_data;
//   await data.splice(0, 0, { Order_date: req.body.order_date });
//   console.log("1231242343242354", req.body.email);

//   //if email not exisitng in db then create: else: InsertMany()
//   let eId = await Order.findOne({ email: req.body.email });
//   console.log(eId);
//   if (eId === null) {
//     try {
//       console.log(data);
//       console.log("1231242343242354", req.body.email);
//       await Order.create({
//         email: req.body.email,
//         order_data: [data],
//       }).then(() => {
//         res.json({ success: true });
//       });
//     } catch (error) {
//       console.log(error.message);
//       res.status(500).send("Server Error: " + error.message);
//     }
//   } else {
//     try {
//       await Order.findOneAndUpdate(
//         { email: req.body.email },
//         { $push: { order_data: data } }
//       ).then(() => {
//         res.json({ success: true });
//       });
//     } catch (error) {
//       console.log(error.message);
//       res.status(500).send("Server Error: " + error.message);
//     }
//   }
// });

module.exports = Routes;
