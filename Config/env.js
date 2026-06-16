require("dotenv").config();

const isProduction = process.env.NODE_ENV === "production";

const NETWORK_URLS = {
  mainnet: {
    xrpl: "https://xrplcluster.com/",
    stellar: "https://horizon.stellar.org",
  },
  testnet: {
    xrpl: "https://testnet.xrpl-labs.com/",
    stellar: "https://horizon-testnet.stellar.org",
  },
};

const cryptoNetwork = (process.env.CRYPTO_NETWORK || "mainnet").toLowerCase();
const networkDefaults = NETWORK_URLS[cryptoNetwork] || NETWORK_URLS.mainnet;

const env = {
  URL: process.env.URL || "",
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET || "dev_secret_change_me",
  PORT: parseInt(process.env.PORT, 10) || 3000,
  NODE_ENV: process.env.NODE_ENV || "development",
  SANDBOX_MODE: isProduction ? false : process.env.SANDBOX_MODE !== "false",
  CRYPTO_NETWORK: cryptoNetwork === "testnet" ? "testnet" : "mainnet",
  XRPL_HTTP_URL: process.env.XRPL_HTTP_URL || networkDefaults.xrpl,
  STELLAR_HORIZON_URL: process.env.STELLAR_HORIZON_URL || networkDefaults.stellar,
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || "",
  TELEGRAM_BOT_USERNAME: process.env.TELEGRAM_BOT_USERNAME || "",
  TELEGRAM_LOGIN_DOMAIN: process.env.TELEGRAM_LOGIN_DOMAIN || "",
  TELEGRAM_PUBLIC_APP_URL:
    process.env.TELEGRAM_PUBLIC_APP_URL || process.env.CLIENT_URL || "https://gofood-latest.onrender.com",
  DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN || "",
  DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID || "",
  DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET || "",
  DISCORD_REDIRECT_URI: process.env.DISCORD_REDIRECT_URI || "",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3001",
  MERCHANT_XRP_ADDRESS: process.env.MERCHANT_XRP_ADDRESS || "",
  MERCHANT_XLM_ADDRESS: process.env.MERCHANT_XLM_ADDRESS || "",
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || "",
  COINGECKO_API_KEY: process.env.COINGECKO_API_KEY || "",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  OPENAI_MODEL: process.env.OPENAI_MODEL || "gpt-4o-mini",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  GROQ_API_KEY: process.env.GROQ_API_KEY || "",
  GROQ_MODEL: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || "",
  OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free",
  CEREBRAS_API_KEY: process.env.CEREBRAS_API_KEY || "",
  CEREBRAS_MODEL: process.env.CEREBRAS_MODEL || "llama3.1-8b",
  MENU_AI_PROVIDER_ORDER:
    process.env.MENU_AI_PROVIDER_ORDER || "gemini,groq,openrouter,cerebras,openai",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "",
};

if (!env.URL && env.NODE_ENV === "development") {
  console.warn("[env] URL not set — using in-memory database fallback");
}

if (env.ACCESS_TOKEN_SECRET === "dev_secret_change_me" && isProduction) {
  console.error("[env] ACCESS_TOKEN_SECRET must be set in production");
  process.exit(1);
}

if (isProduction && process.env.SANDBOX_MODE === "true") {
  console.warn("[env] SANDBOX_MODE forced off in production");
}

if (!NETWORK_URLS[cryptoNetwork] && process.env.CRYPTO_NETWORK) {
  console.warn(`[env] Unknown CRYPTO_NETWORK="${process.env.CRYPTO_NETWORK}" — using mainnet defaults`);
}

if (env.CRYPTO_NETWORK === "testnet") {
  console.log(`[env] Crypto network: testnet (XRPL ${env.XRPL_HTTP_URL})`);
} else {
  console.log(`[env] Crypto network: mainnet (XRPL ${env.XRPL_HTTP_URL})`);
}

module.exports = env;
