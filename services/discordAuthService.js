const crypto = require("crypto");
const env = require("../Config/env");

const states = new Map();

function isConfigured() {
  return Boolean(
    env.DISCORD_CLIENT_ID &&
      env.DISCORD_CLIENT_SECRET &&
      env.DISCORD_REDIRECT_URI
  );
}

function createState({ mode, userId }) {
  const state = crypto.randomBytes(16).toString("hex");
  states.set(state, {
    mode,
    userId: userId || null,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });
  return state;
}

function consumeState(state) {
  const entry = states.get(state);
  if (!entry) return null;
  states.delete(state);
  if (entry.expiresAt < Date.now()) return null;
  return entry;
}

function getAuthorizationUrl({ mode, userId }) {
  if (!isConfigured()) {
    throw Object.assign(new Error("Discord login is not configured"), { statusCode: 503 });
  }
  const state = createState({ mode, userId });
  const params = new URLSearchParams({
    client_id: env.DISCORD_CLIENT_ID,
    redirect_uri: env.DISCORD_REDIRECT_URI,
    response_type: "code",
    scope: "identify",
    state,
    prompt: "consent",
  });
  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}

async function exchangeCode(code) {
  const body = new URLSearchParams({
    client_id: env.DISCORD_CLIENT_ID,
    client_secret: env.DISCORD_CLIENT_SECRET,
    grant_type: "authorization_code",
    code,
    redirect_uri: env.DISCORD_REDIRECT_URI,
  });

  const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const tokenData = await tokenRes.json();
  if (!tokenRes.ok) {
    throw Object.assign(new Error(tokenData.error_description || "Discord token exchange failed"), {
      statusCode: 400,
    });
  }

  const userRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const userData = await userRes.json();
  if (!userRes.ok) {
    throw Object.assign(new Error("Failed to fetch Discord profile"), { statusCode: 400 });
  }

  return {
    discordUserId: String(userData.id),
    discordUsername: userData.global_name || userData.username || "",
  };
}

function getClientRedirect(path = "/") {
  return env.CLIENT_URL.replace(/\/$/, "") + path;
}

module.exports = {
  isConfigured,
  getAuthorizationUrl,
  exchangeCode,
  consumeState,
  getClientRedirect,
};
