const jwt = require("jsonwebtoken");
const env = require("../Config/env");
const UserRepository = require("../repositories/UserRepository");
const { isAdminRole } = require("../constants/roles");

async function loadUserFromToken(token) {
  const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET);
  const user = await UserRepository.findById(decoded.user.id);
  if (!user) return null;
  return {
    id: user._id ? user._id.toString() : user.id,
    email: user.email,
    name: user.name,
    role: UserRepository.resolveRole(user),
  };
}

async function sseAuthFromQuery(req, res, next) {
  const token = req.query.token;
  if (!token) {
    return res.status(401).json({ success: false, message: "Token required" });
  }
  try {
    const user = await loadUserFromToken(token);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
}

async function sseAdminFromQuery(req, res, next) {
  const token = req.query.token;
  if (!token) {
    return res.status(401).json({ success: false, message: "Token required" });
  }
  try {
    const user = await loadUserFromToken(token);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    if (!isAdminRole(user.role)) {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }
    req.user = user;
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

module.exports = { sseAuthFromQuery, sseAdminFromQuery, securityHeaders };
