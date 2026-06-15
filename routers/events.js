const express = require("express");
const router = express.Router();
const eventBus = require("../services/eventBus");
const priceService = require("../services/priceService");
const { sseAuthFromQuery } = require("../middleware/security");

function initSSE(res) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();
}

function sendEvent(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

router.get("/prices", async (req, res) => {
  initSSE(res);
  const prices = await priceService.getPrices();
  sendEvent(res, "prices", prices);

  const unsubscribe = eventBus.subscribe("prices:update", (data) => {
    sendEvent(res, "prices", data);
  });

  const heartbeat = setInterval(() => {
    res.write(": heartbeat\n\n");
  }, 30000);

  req.on("close", () => {
    unsubscribe();
    clearInterval(heartbeat);
  });
});

router.get("/orders", sseAuthFromQuery, (req, res) => {
  initSSE(res);
  const userEmail = req.user.email;

  const unsubscribe = eventBus.subscribe("order:update", (data) => {
    if (data.email === userEmail) {
      sendEvent(res, "order", data);
    }
  });

  const heartbeat = setInterval(() => {
    res.write(": heartbeat\n\n");
  }, 30000);

  req.on("close", () => {
    unsubscribe();
    clearInterval(heartbeat);
  });
});

module.exports = router;
