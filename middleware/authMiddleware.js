const jwt = require("jsonwebtoken");
const env = require("../Config/env");
const UserRepository = require("../repositories/UserRepository");

const authMiddleware = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET);
    const userId = decoded.user?.id;
    const user = await UserRepository.findById(userId);

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    req.user = {
      id: user._id ? user._id.toString() : user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin || false,
      walletAddress: user.walletAddress,
      walletType: user.walletType,
      notifications: UserRepository.toPlainNotifications(user.notifications),
    };
    next();
  } catch (error) {
    console.error("[authMiddleware]", error.message);
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

module.exports = authMiddleware;
