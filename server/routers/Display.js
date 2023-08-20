const express = require("express");
const Routes = express.Router();
Routes.post("/fooditems", async (req, res) => {
  try {
    res.send([global.food_items, global.foodCategory]);
  } catch (error) {
    res.send(error);
  }
});
module.exports = Routes;
