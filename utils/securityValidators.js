const env = require("../Config/env");

const DISCORD_WEBHOOK_PATTERN =
  /^https:\/\/(discord\.com|discordapp\.com)\/api\/webhooks\/\d+\/[\w-]+$/;

const TELEGRAM_CHAT_ID_PATTERN = /^-?\d{5,20}$/;

const TX_HASH_PATTERNS = {
  XRP: /^[A-F0-9]{64}$/i,
  XLM: /^[a-f0-9]{64}$/,
  SANDBOX: /^sandbox_tx_/,
};

function isProduction() {
  return env.NODE_ENV === "production";
}

function isSandboxAllowed() {
  return env.SANDBOX_MODE && !isProduction();
}

function validateDiscordWebhookUrl(url) {
  if (!url) return { valid: true, url: "" };
  if (!DISCORD_WEBHOOK_PATTERN.test(url)) {
    return { valid: false, message: "Discord webhook must be a valid discord.com/api/webhooks URL" };
  }
  return { valid: true, url };
}

function validateTelegramChatId(chatId) {
  if (!chatId) return { valid: true, chatId: "" };
  if (!TELEGRAM_CHAT_ID_PATTERN.test(String(chatId).trim())) {
    return { valid: false, message: "Telegram Chat ID must be a numeric ID" };
  }
  return { valid: true, chatId: String(chatId).trim() };
}

function validateWalletType(walletType) {
  if (walletType === "sandbox" && !isSandboxAllowed()) {
    return { valid: false, message: "Sandbox wallet is disabled in production" };
  }
  if (!["gem", "freighter", "sandbox"].includes(walletType)) {
    return { valid: false, message: "Invalid wallet type" };
  }
  return { valid: true };
}

function validateTxHash(txHash, cryptoAsset, { allowSandbox = true } = {}) {
  if (!txHash) return { valid: false, message: "Transaction hash required" };

  if (TX_HASH_PATTERNS.SANDBOX.test(txHash)) {
    if (!allowSandbox || !isSandboxAllowed()) {
      return { valid: false, message: "Sandbox transactions are not allowed" };
    }
    return { valid: true, sandbox: true };
  }

  if (cryptoAsset === "XRP" && TX_HASH_PATTERNS.XRP.test(txHash)) {
    return { valid: true, sandbox: false };
  }
  if (cryptoAsset === "XLM" && TX_HASH_PATTERNS.XLM.test(txHash)) {
    return { valid: true, sandbox: false };
  }

  return { valid: false, message: "Invalid transaction hash format" };
}

function sanitizeUserNotifications(prefs) {
  const result = { ...prefs };

  const protectedFields = [
    "telegramUserId",
    "telegramUsername",
    "telegramVerified",
    "discordUserId",
    "discordUsername",
    "discordVerified",
  ];
  protectedFields.forEach((field) => delete result[field]);

  if (prefs.discordWebhookUrl !== undefined) {
    const check = validateDiscordWebhookUrl(prefs.discordWebhookUrl);
    if (!check.valid) throw Object.assign(new Error(check.message), { statusCode: 400 });
    result.discordWebhookUrl = check.url;
  }

  if (prefs.telegramChatId !== undefined) {
    const check = validateTelegramChatId(prefs.telegramChatId);
    if (!check.valid) throw Object.assign(new Error(check.message), { statusCode: 400 });
    result.telegramChatId = check.chatId;
  }

  return result;
}

module.exports = {
  isProduction,
  isSandboxAllowed,
  validateDiscordWebhookUrl,
  validateTelegramChatId,
  validateWalletType,
  validateTxHash,
  sanitizeUserNotifications,
};
