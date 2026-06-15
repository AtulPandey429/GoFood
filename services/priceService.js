const PriceFeedFactory = require("../factories/priceFeed/PriceFeedFactory");
const eventBus = require("./eventBus");

let cache = null;
let cacheTime = 0;
let pollTimer = null;
const TTL = 60 * 1000;

async function refreshPrices() {
  try {
    cache = await PriceFeedFactory.fetchWithFallback();
    cacheTime = Date.now();
    eventBus.publish("prices:update", cache);
    return cache;
  } catch (e) {
    console.warn("[price] refresh failed:", e.message);
    return cache;
  }
}

const priceService = {
  async getPrices() {
    const now = Date.now();
    if (cache && now - cacheTime < TTL) return cache;
    return refreshPrices();
  },

  startBackgroundPoll() {
    if (pollTimer) return;
    refreshPrices();
    pollTimer = setInterval(refreshPrices, TTL);
  },

  stopBackgroundPoll() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  },
};

module.exports = priceService;
