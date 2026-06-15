const express = require("express");
const router = express.Router();
const priceService = require("../services/priceService");

router.get("/prices", async (req, res) => {
  try {
    const prices = await priceService.getPrices();
    res.json({ success: true, ...prices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
