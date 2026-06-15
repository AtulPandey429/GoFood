const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const env = require("../Config/env");
const UserRepository = require("../repositories/UserRepository");
const { validateWalletType } = require("../utils/securityValidators");
const telegramAuthService = require("./telegramAuthService");
const discordAuthService = require("./discordAuthService");

const challenges = new Map();

const signToken = (user) => {
  const id = user._id ? user._id.toString() : user.id;
  return jwt.sign({ user: { id } }, env.ACCESS_TOKEN_SECRET);
};

const authService = {
  async registerUser({ name, email, password, location }) {
    if (!name || !email || !password || !location) {
      throw new Error("All fields are mandatory");
    }
    const existing = await UserRepository.findByEmail(email);
    if (existing) {
      const err = new Error("Email already registered");
      err.statusCode = 400;
      throw err;
    }

    const salt = await bcrypt.genSalt(10);
    const securePassword = await bcrypt.hash(password, salt);
    const user = await UserRepository.create({
      name,
      email,
      password: securePassword,
      location,
    });
    return UserRepository.toSafeUser(user);
  },

  async loginWithCredentials({ email, password }) {
    const user = await UserRepository.findByEmail(email);
    if (!user) throw new Error("Incorrect email or password");

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error("Incorrect email or password");

    const token = signToken(user);
    return { token, user: UserRepository.toSafeUser(user) };
  },

  issueWalletChallenge() {
    const now = Date.now();
    for (const [nonce, expiresAt] of challenges.entries()) {
      if (new Date(expiresAt) < new Date(now)) challenges.delete(nonce);
    }
    if (challenges.size > 10000) {
      const err = new Error("Too many pending challenges");
      err.statusCode = 429;
      throw err;
    }
    const nonce = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    challenges.set(nonce, expiresAt);
    return { nonce, expiresAt };
  },

  async verifyWalletLogin({ walletAddress, walletType, signature, nonce, publicKey }) {
    const typeCheck = validateWalletType(walletType);
    if (!typeCheck.valid) {
      const err = new Error(typeCheck.message);
      err.statusCode = 403;
      throw err;
    }
    const expiresAt = challenges.get(nonce);
    if (!expiresAt || new Date(expiresAt) < new Date()) {
      challenges.delete(nonce);
      throw new Error("Challenge expired or invalid");
    }
    challenges.delete(nonce);

    const WalletAuthFactory = require("../factories/wallet/WalletAuthFactory");
    const verifier = WalletAuthFactory.create(walletType);
    const valid = await verifier.verifySignature(walletAddress, nonce, signature, publicKey);
    if (!valid) throw new Error("Invalid wallet signature");

    const user = await UserRepository.upsertWalletUser({ walletAddress, walletType });
    const token = signToken(user);
    return { token, user: UserRepository.toSafeUser(user) };
  },

  async getProfile(userId) {
    const user = await UserRepository.findById(userId);
    if (!user) throw new Error("User not found");
    return UserRepository.toSafeUser(user);
  },

  getAuthProviders() {
    return {
      telegram: telegramAuthService.isConfigured(),
      telegramBotUsername: env.TELEGRAM_BOT_USERNAME || null,
      discord: discordAuthService.isConfigured(),
    };
  },

  async loginWithTelegram(payload) {
    const telegramData = telegramAuthService.verifyTelegramAuth(payload);
    let user = await UserRepository.findByTelegramUserId(telegramData.telegramUserId);
    if (!user) {
      user = await UserRepository.upsertTelegramUser(telegramData);
    } else if (!user.notifications?.telegramVerified) {
      user = await UserRepository.linkTelegramAccount(
        user._id?.toString() || user.id,
        telegramData
      );
    }
    const token = signToken(user);
    return { token, user: UserRepository.toSafeUser(user) };
  },

  async linkTelegramToUser(userId, payload) {
    const telegramData = telegramAuthService.verifyTelegramAuth(payload);
    const existing = await UserRepository.findByTelegramUserId(telegramData.telegramUserId);
    const existingId = existing?._id?.toString() || existing?.id;
    if (existing && existingId !== userId) {
      const err = new Error("This Telegram account is already linked to another user");
      err.statusCode = 409;
      throw err;
    }
    const user = await UserRepository.linkTelegramAccount(userId, telegramData);
    const safe = UserRepository.toSafeUser(user);

    try {
      const telegramBotService = require("./telegramBotService");
      await telegramBotService.sendBotMessage(
        telegramData.telegramChatId,
        "<b>GoFood</b> linked!\nOrder alerts will be sent to this chat."
      );
    } catch {
      /* user may need to /start bot first — deep link flow handles that */
    }

    return safe;
  },

  getDiscordLoginUrl() {
    return discordAuthService.getAuthorizationUrl({ mode: "login" });
  },

  getDiscordLinkUrl(userId) {
    return discordAuthService.getAuthorizationUrl({ mode: "link", userId });
  },

  async handleDiscordCallback(code, state) {
    const stateData = discordAuthService.consumeState(state);
    if (!stateData) {
      const err = new Error("Invalid or expired Discord OAuth state");
      err.statusCode = 400;
      throw err;
    }

    const profile = await discordAuthService.exchangeCode(code);

    if (stateData.mode === "link") {
      if (!stateData.userId) {
        const err = new Error("Discord link session invalid");
        err.statusCode = 400;
        throw err;
      }
      const existing = await UserRepository.findByDiscordUserId(profile.discordUserId);
      const existingId = existing?._id?.toString() || existing?.id;
      if (existing && existingId !== stateData.userId) {
        const err = new Error("This Discord account is already linked to another user");
        err.statusCode = 409;
        throw err;
      }
      const user = await UserRepository.linkDiscordAccount(stateData.userId, profile);
      return { mode: "link", user: UserRepository.toSafeUser(user) };
    }

    let user = await UserRepository.findByDiscordUserId(profile.discordUserId);
    if (!user) {
      user = await UserRepository.upsertDiscordUser(profile);
    } else if (!user.notifications?.discordVerified) {
      user = await UserRepository.linkDiscordAccount(
        user._id?.toString() || user.id,
        profile
      );
    }
    const token = signToken(user);
    return { mode: "login", token, user: UserRepository.toSafeUser(user) };
  },

  async promoteAdminIfNeeded() {
    if (!env.ADMIN_EMAIL) return;
    const admin = await UserRepository.findOneAdmin();
    if (!admin) {
      await UserRepository.promoteToAdmin(env.ADMIN_EMAIL);
      console.log(`[auth] Promoted ${env.ADMIN_EMAIL} to admin`);
    }
  },
};

module.exports = authService;
