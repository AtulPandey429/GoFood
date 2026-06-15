class CoinGeckoProvider {
  async fetchPrices() {
    const env = require("../../Config/env");
    const headers = { Accept: "application/json" };
    if (env.COINGECKO_API_KEY) {
      headers["x-cg-demo-api-key"] = env.COINGECKO_API_KEY;
    }
    const url =
      "https://api.coingecko.com/api/v3/simple/price?ids=ripple,stellar&vs_currencies=usd,inr&include_24hr_change=true";
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error("CoinGecko API error");
    const data = await res.json();
    return {
      xrp: { usd: data.ripple.usd, inr: data.ripple.inr, change24h: data.ripple.usd_24h_change || 0 },
      xlm: { usd: data.stellar.usd, inr: data.stellar.inr, change24h: data.stellar.usd_24h_change || 0 },
      updatedAt: new Date().toISOString(),
    };
  }
}

module.exports = CoinGeckoProvider;
