const env = require("../Config/env");

const errorHandler = (err, req, res, next) => {
  const status = err.statusCode || 500;
  console.error("[error]", err.message);

  const message =
    status >= 500 && env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message || "Internal server error";

  res.status(status).json({ success: false, message });
};

module.exports = errorHandler;
