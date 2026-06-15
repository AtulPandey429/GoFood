require("./Config/env");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const rateLimit = require("express-rate-limit");
const db = require("./Config/db");
const errorHandler = require("./middleware/errorHandler");
const { securityHeaders } = require("./middleware/security");
const authService = require("./services/authService");
const priceService = require("./services/priceService");
const { isSandboxAllowed } = require("./utils/securityValidators");

const app = express();
const env = require("./Config/env");
const port = env.PORT;

// CRA/webpack dev proxy sends X-Forwarded-For; required for express-rate-limit
app.set("trust proxy", 1);

const telegramBotService = require("./services/telegramBotService");

db().then(() => {
  authService.promoteAdminIfNeeded();
  priceService.startBackgroundPoll();
  telegramBotService.startPolling();
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
});

const corsOptions =
  env.NODE_ENV === "production" && env.CORS_ORIGIN
    ? { origin: env.CORS_ORIGIN.split(",").map((o) => o.trim()), credentials: true }
    : { origin: true, credentials: true };

app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(express.json({ limit: "100kb" }));
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "ok",
    sandboxAllowed: isSandboxAllowed(),
    cryptoNetwork: env.CRYPTO_NETWORK,
    xrplUrl: env.XRPL_HTTP_URL,
    stellarHorizon: env.STELLAR_HORIZON_URL,
    merchantXrp: env.MERCHANT_XRP_ADDRESS || "",
    merchantXlm: env.MERCHANT_XLM_ADDRESS || "",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authLimiter, require("./routers/auth"));
app.use("/api/orders", orderLimiter, require("./routers/orders"));
app.use("/api/display", require("./routers/Display"));
app.use("/api/user", require("./routers/user"));
app.use("/api/admin", require("./routers/admin"));
app.use("/api/crypto", require("./routers/crypto"));
app.use("/api/events", require("./routers/events"));

app.use("/api/user", authLimiter, require("./routers/CreateUser"));
app.use("/api/user", require("./routers/Display"));
app.use("/api/user", orderLimiter, require("./routers/Order"));

app.use(express.static(path.join(__dirname, "./client/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "./client/dist/index.html"));
});

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server running on port ${port} [${env.NODE_ENV}]`);
});
