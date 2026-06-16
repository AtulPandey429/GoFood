const PriceFeedFactory = require("../factories/priceFeed/PriceFeedFactory");
const eventBus = require("./eventBus");

const PRICE_TTL_MS = 10 * 60 * 1000; // 10 minutes

let cache = null;
let cacheTime = 0;
let pollTimer = null;

function withMeta(data) {
  const cachedAt = cacheTime || Date.now();
  return {
    ...data,
    cachedAt,
    nextUpdateAt: cachedAt + PRICE_TTL_MS,
    ttlMinutes: PRICE_TTL_MS / 60000,
  };
}

async function refreshPrices() {
  try {
    const fetched = await PriceFeedFactory.fetchWithFallback();
    cacheTime = Date.now();
    cache = withMeta(fetched);
    eventBus.publish("prices:update", cache);
    return cache;
  } catch (e) {
    console.warn("[price] refresh failed:", e.message);
    return cache;
  }
}

const priceService = {
  PRICE_TTL_MS,

  async getPrices() {
    const now = Date.now();
    if (cache && now - cacheTime < PRICE_TTL_MS) {
      return cache;
    }
    return refreshPrices();
  },

  startBackgroundPoll() {
    if (pollTimer) return;
    refreshPrices();
    pollTimer = setInterval(refreshPrices, PRICE_TTL_MS);
  },

  stopBackgroundPoll() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  },
};

module.exports = priceService;
