const express = require("express");
const router = express.Router();
const eventBus = require("../services/eventBus");
const priceService = require("../services/priceService");
const presenceService = require("../services/presenceService");
const { sseAuthFromQuery, sseAdminFromQuery } = require("../middleware/security");

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

router.get("/presence", sseAuthFromQuery, (req, res) => {
  initSSE(res);
  const userId = req.user.id;
  presenceService.connect(req.user);

  const unsubscribe = eventBus.subscribe("presence:update", (data) => {
    sendEvent(res, "presence", data);
  });

  const heartbeat = setInterval(() => {
    res.write(": heartbeat\n\n");
  }, 30000);

  req.on("close", () => {
    presenceService.disconnect(userId);
    unsubscribe();
    clearInterval(heartbeat);
  });
});

router.get("/admin", sseAdminFromQuery, (req, res) => {
  initSSE(res);
  sendEvent(res, "presence", presenceService.getSnapshot());

  const unsubPresence = eventBus.subscribe("presence:update", (data) => {
    sendEvent(res, "presence", data);
  });

  const unsubOrders = eventBus.subscribe("order:update", (data) => {
    sendEvent(res, "order", data);
  });

  const heartbeat = setInterval(() => {
    res.write(": heartbeat\n\n");
  }, 30000);

  req.on("close", () => {
    unsubPresence();
    unsubOrders();
    clearInterval(heartbeat);
  });
});

router.get("/orders", sseAuthFromQuery, (req, res) => {
  initSSE(res);
  const userId = req.user.id;

  const unsubscribe = eventBus.subscribe("order:update", (data) => {
    if (data.userId === userId || (data.email && data.email === req.user.email)) {
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
