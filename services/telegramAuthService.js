const crypto = require("crypto");
const env = require("../Config/env");

function normalizeTelegramPayload(data) {
  const normalized = {};
  for (const [key, value] of Object.entries(data || {})) {
    if (key === "hash" || value === undefined || value === null) continue;
    normalized[key] = String(value);
  }
  return normalized;
}

function buildDataCheckString(fields) {
  return Object.keys(fields)
    .sort()
    .map((key) => `${key}=${fields[key]}`)
    .join("\n");
}

function verifyTelegramAuth(data) {
  if (!env.TELEGRAM_BOT_TOKEN) {
    throw Object.assign(new Error("Telegram login is not configured"), { statusCode: 503 });
  }
  if (!data?.hash || !data?.id || !data?.auth_date) {
    throw Object.assign(new Error("Invalid Telegram auth payload"), { statusCode: 400 });
  }

  const authAge = Math.floor(Date.now() / 1000) - Number(data.auth_date);
  if (authAge > 86400) {
    throw Object.assign(new Error("Telegram auth expired — try again"), { statusCode: 400 });
  }

  const fields = normalizeTelegramPayload(data);
  const secret = crypto.createHash("sha256").update(env.TELEGRAM_BOT_TOKEN).digest();
  const hmac = crypto.createHmac("sha256", secret).update(buildDataCheckString(fields)).digest("hex");

  if (hmac !== data.hash) {
    throw Object.assign(new Error("Invalid Telegram signature"), { statusCode: 401 });
  }

  return {
    telegramUserId: String(data.id),
    telegramUsername: data.username ? String(data.username) : "",
    telegramChatId: String(data.id),
    firstName: data.first_name ? String(data.first_name) : "Telegram",
    lastName: data.last_name ? String(data.last_name) : "",
  };
}

module.exports = {
  verifyTelegramAuth,
  isConfigured: () => Boolean(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_BOT_USERNAME),
};
