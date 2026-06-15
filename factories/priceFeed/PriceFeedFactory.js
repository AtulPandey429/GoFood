const CoinGeckoProvider = require("./CoinGeckoProvider");
const CoinPaprikaProvider = require("./CoinPaprikaProvider");

const PriceFeedFactory = {
  create(provider = "coingecko") {
    if (provider === "coinpaprika") return new CoinPaprikaProvider();
    return new CoinGeckoProvider();
  },

  async fetchWithFallback() {
    try {
      return await this.create("coingecko").fetchPrices();
    } catch (e) {
      console.warn("[price] CoinGecko failed, trying CoinPaprika:", e.message);
      return this.create("coinpaprika").fetchPrices();
    }
  },
};

module.exports = PriceFeedFactory;
