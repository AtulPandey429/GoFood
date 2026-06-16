const ROLES = {
  ADMIN: "admin",
  USER: "user",
};

const resolveRole = (user) => {
  if (!user) return ROLES.USER;
  if (user.role === ROLES.ADMIN || user.role === ROLES.USER) return user.role;
  if (user.isAdmin) return ROLES.ADMIN;
  return ROLES.USER;
};

const isAdminRole = (role) => role === ROLES.ADMIN;

module.exports = { ROLES, resolveRole, isAdminRole };
