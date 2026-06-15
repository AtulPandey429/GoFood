const jwt = require("jsonwebtoken");
const env = require("../Config/env");
const UserRepository = require("../repositories/UserRepository");

async function sseAuthFromQuery(req, res, next) {
  const token = req.query.token;
  if (!token) {
    return res.status(401).json({ success: false, message: "Token required" });
  }
  try {
    const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET);
    const user = await UserRepository.findById(decoded.user.id);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    req.user = {
      id: user._id ? user._id.toString() : user.id,
      email: user.email,
    };
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
}

function securityHeaders(req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  if (env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
}

module.exports = { sseAuthFromQuery, securityHeaders };
