const crypto = require("crypto");
const env = require("../Config/env");
const UserRepository = require("../repositories/UserRepository");

const linkTokens = new Map();
const linkResults = new Map();
let lastUpdateId = 0;
let polling = false;

function createLinkToken(userId) {
  const token = crypto.randomBytes(12).toString("hex");
  linkTokens.set(token, { userId, expiresAt: Date.now() + 10 * 60 * 1000 });
  return token;
}

function getLinkResult(token) {
  const result = linkResults.get(token);
  if (!result) return { status: "pending" };
  if (result.expiresAt < Date.now()) {
    linkResults.delete(token);
    return { status: "expired" };
  }
  return { status: "linked", user: result.user };
}

async function sendBotMessage(chatId, text) {
  if (!env.TELEGRAM_BOT_TOKEN) return false;
  const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
  return res.ok;
}

async function linkChatToUser(userId, chatId, username) {
  const telegramData = {
    telegramUserId: String(chatId),
    telegramChatId: String(chatId),
    telegramUsername: username || "",
  };
  const user = await UserRepository.linkTelegramAccount(userId, telegramData);
  const safe = UserRepository.toSafeUser(user);
  await sendBotMessage(
    chatId,
    "<b>GoFood</b> linked successfully!\nYou will receive order updates here."
  );
  return safe;
}

async function handleUpdate(update) {
  const msg = update.message;
  if (!msg?.text) return;

  const text = msg.text.trim();
  const chatId = msg.chat.id;
  const username = msg.from?.username || "";

  if (text.startsWith("/start link_")) {
    const token = text.replace("/start link_", "").split(/\s/)[0];
    const entry = linkTokens.get(token);
    if (!entry || entry.expiresAt < Date.now()) {
      await sendBotMessage(chatId, "This link expired. Go back to GoFood and try again.");
      return;
    }
    linkTokens.delete(token);
    try {
      const user = await linkChatToUser(entry.userId, chatId, username);
      linkResults.set(token, { user, expiresAt: Date.now() + 5 * 60 * 1000 });
    } catch (e) {
      await sendBotMessage(chatId, `Could not link: ${e.message}`);
    }
  }

  if (text === "/start") {
    await sendBotMessage(
      chatId,
      "Welcome to <b>GoFood</b>!\n\nLink your account from the GoFood website (Alerts page) to get order notifications."
    );
  }
}

async function pollOnce() {
  if (!env.TELEGRAM_BOT_TOKEN) return;
  const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getUpdates?offset=${lastUpdateId + 1}&timeout=25`;
  const res = await fetch(url);
  if (!res.ok) return;
  const data = await res.json();
  if (!data.ok || !Array.isArray(data.result)) return;

  for (const update of data.result) {
    lastUpdateId = update.update_id;
    try {
      await handleUpdate(update);
    } catch (e) {
      console.warn("[telegram-bot] update error:", e.message);
    }
  }
}

function startPolling() {
  if (polling || !env.TELEGRAM_BOT_TOKEN) return;
  polling = true;
  const loop = async () => {
    while (polling) {
      try {
        await pollOnce();
      } catch (e) {
        console.warn("[telegram-bot] poll error:", e.message);
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  };
  loop();
  console.log("[telegram-bot] link listener started");
}

function stopPolling() {
  polling = false;
}

function getBotDeepLink(token) {
  const username = env.TELEGRAM_BOT_USERNAME || "gofood_429_bot";
  return `https://t.me/${username}?start=link_${token}`;
}

module.exports = {
  createLinkToken,
  getLinkResult,
  getBotDeepLink,
  linkChatToUser,
  sendBotMessage,
  startPolling,
  stopPolling,
};
