const express = require("express");
const router = express.Router();

// Legacy aliases — forward to new auth routes
router.use(require("./auth"));

module.exports = router;
