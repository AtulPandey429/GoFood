const { isAdminRole } = require("../constants/roles");

const requireRole = (...allowedRoles) => (req, res, next) => {
  const role = req.user?.role;
  if (!role || !allowedRoles.includes(role)) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }
  next();
};

const requireAdmin = requireRole("admin");

module.exports = { requireRole, requireAdmin, isAdminRole };
