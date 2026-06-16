const express = require("express");
const router = express.Router();
const FoodRepository = require("../repositories/FoodRepository");
const { normalizeFoodItems } = require("../utils/normalizeFoodOptions");

router.post("/fooditems", async (req, res) => {
  const data = await FoodRepository.getAll();
  res.json([normalizeFoodItems(data.items), data.categories]);
});

module.exports = router;
