const mongoose = require("mongoose");
const User = require("../model/User");
const { ROLES, resolveRole } = require("../constants/roles");
const { hasRealEmail, getDisplayIdentity } = require("../utils/userIdentity");

const memoryUsers = [];
let memoryIdCounter = 1;

const toPlainNotifications = (notifications) => {
  if (!notifications) return {};
  if (typeof notifications.toObject === "function") return notifications.toObject();
  return { ...notifications };
};

const toSafeUser = (user) => ({
  id: user._id?.toString() || user.id,
  name: user.name,
  email: hasRealEmail(user) ? user.email : null,
  displayIdentity: getDisplayIdentity(user),
  hasEmail: hasRealEmail(user),
  hasWallet: Boolean(user.walletAddress),
  location: user.location,
  role: resolveRole(user),
  walletAddress: user.walletAddress || null,
  walletType: user.walletType || null,
  notifications: toPlainNotifications(user.notifications),
});

const UserRepository = {
  _useMemory() {
    return global.useMemoryDb === true || mongoose.connection.readyState !== 1;
  },

  async create(data) {
    if (this._useMemory()) {
      const user = { id: String(memoryIdCounter++), ...data, role: ROLES.USER, isAdmin: false, notifications: {} };
      memoryUsers.push(user);
      return user;
    }
    return User.create(data);
  },

  async findByEmail(email) {
    if (this._useMemory()) {
      return memoryUsers.find((u) => u.email === email) || null;
    }
    return User.findOne({ email });
  },

  async findById(id) {
    if (this._useMemory()) {
      return memoryUsers.find((u) => u.id === id || u._id?.toString() === id) || null;
    }
    return User.findById(id);
  },

  async findByWalletAddress(walletAddress) {
    if (this._useMemory()) {
      return memoryUsers.find((u) => u.walletAddress === walletAddress) || null;
    }
    return User.findOne({ walletAddress });
  },

  async findByTelegramUserId(telegramUserId) {
    const id = String(telegramUserId);
    if (this._useMemory()) {
      return memoryUsers.find((u) => u.notifications?.telegramUserId === id) || null;
    }
    return User.findOne({ "notifications.telegramUserId": id });
  },

  async findByDiscordUserId(discordUserId) {
    const id = String(discordUserId);
    if (this._useMemory()) {
      return memoryUsers.find((u) => u.notifications?.discordUserId === id) || null;
    }
    return User.findOne({ "notifications.discordUserId": id });
  },

  async findAll() {
    if (this._useMemory()) {
      return memoryUsers.map((u) => {
        const { password, ...safe } = u;
        return safe;
      });
    }
    return User.find({}, "-password").lean();
  },

  async count() {
    if (this._useMemory()) return memoryUsers.length;
    return User.countDocuments();
  },

  async findOneAdmin() {
    if (this._useMemory()) {
      return memoryUsers.find((u) => resolveRole(u) === ROLES.ADMIN) || null;
    }
    return User.findOne({ $or: [{ role: ROLES.ADMIN }, { isAdmin: true }] });
  },

  async promoteToAdmin(email) {
    if (this._useMemory()) {
      const user = memoryUsers.find((u) => u.email === email);
      if (user) {
        user.role = ROLES.ADMIN;
        user.isAdmin = true;
      }
      return user;
    }
    return User.findOneAndUpdate(
      { email },
      { role: ROLES.ADMIN, isAdmin: true },
      { new: true }
    );
  },

  async updateById(id, data) {
    if (this._useMemory()) {
      const idx = memoryUsers.findIndex((u) => u.id === id || u._id?.toString() === id);
      if (idx === -1) return null;
      memoryUsers[idx] = { ...memoryUsers[idx], ...data };
      const { password, ...safe } = memoryUsers[idx];
      return safe;
    }
    return User.findByIdAndUpdate(id, data, { new: true }).select("-password");
  },

  async upsertWalletUser({ walletAddress, walletType, name }) {
    let user = await this.findByWalletAddress(walletAddress);
    if (!user) {
      user = await this.create({
        name: name || `Wallet ${walletAddress.slice(0, 8)}`,
        location: "Web3",
        walletAddress,
        walletType,
      });
    }
    return user;
  },

  async linkWalletToUser(userId, { walletAddress, walletType }) {
    const owner = await this.findByWalletAddress(walletAddress);
    const ownerId = owner?._id?.toString() || owner?.id;
    if (owner && ownerId !== String(userId)) {
      throw new Error("This wallet is already linked to another account");
    }
    const user = await this.findById(userId);
    if (!user) throw new Error("User not found");
    if (user.walletAddress && user.walletAddress !== walletAddress) {
      throw new Error("Another wallet is already linked to this account");
    }
    return this.updateById(userId, { walletAddress, walletType });
  },

  async linkEmailToUser(userId, { email, password }) {
    const user = await this.findById(userId);
    if (!user) throw new Error("User not found");
    if (hasRealEmail(user)) {
      throw new Error("This account already has an email login");
    }
    const existing = await this.findByEmail(email);
    const existingId = existing?._id?.toString() || existing?.id;
    if (existing && existingId !== String(userId)) {
      throw new Error("Email is already registered to another account");
    }
    const bcrypt = require("bcrypt");
    const salt = await bcrypt.genSalt(10);
    const securePassword = await bcrypt.hash(password, salt);
    return this.updateById(userId, { email, password: securePassword });
  },

  async upsertTelegramUser({ telegramUserId, telegramUsername, telegramChatId, firstName, lastName }) {
    let user = await this.findByTelegramUserId(telegramUserId);
    if (!user) {
      const name = [firstName, lastName].filter(Boolean).join(" ").trim() || `Telegram ${telegramUserId}`;
      user = await this.create({
        name,
        email: `tg${telegramUserId}@telegram.local`,
        password: require("crypto").randomBytes(32).toString("hex"),
        location: "Telegram",
        notifications: {
          telegramUserId: String(telegramUserId),
          telegramUsername: telegramUsername || "",
          telegramChatId: String(telegramChatId || telegramUserId),
          telegramVerified: true,
          enableTelegram: true,
        },
      });
    }
    return user;
  },

  async upsertDiscordUser({ discordUserId, discordUsername }) {
    let user = await this.findByDiscordUserId(discordUserId);
    if (!user) {
      user = await this.create({
        name: discordUsername || `Discord ${discordUserId}`,
        email: `dc${discordUserId}@discord.local`,
        password: require("crypto").randomBytes(32).toString("hex"),
        location: "Discord",
        notifications: {
          discordUserId: String(discordUserId),
          discordUsername: discordUsername || "",
          discordVerified: true,
          enableDiscord: false,
        },
      });
    }
    return user;
  },

  async linkTelegramAccount(userId, telegramData) {
    const user = await this.findById(userId);
    if (!user) throw new Error("User not found");
    const notifications = {
      ...toPlainNotifications(user.notifications),
      telegramUserId: String(telegramData.telegramUserId),
      telegramUsername: telegramData.telegramUsername || "",
      telegramChatId: String(telegramData.telegramChatId),
      telegramVerified: true,
      enableTelegram: true,
    };
    return this.updateById(userId, { notifications });
  },

  async linkDiscordAccount(userId, discordData) {
    const user = await this.findById(userId);
    if (!user) throw new Error("User not found");
    const notifications = {
      ...toPlainNotifications(user.notifications),
      discordUserId: discordData.discordUserId,
      discordUsername: discordData.discordUsername || "",
      discordVerified: true,
    };
    return this.updateById(userId, { notifications });
  },

  toSafeUser,
  toPlainNotifications,
  resolveRole,
};

module.exports = UserRepository;
