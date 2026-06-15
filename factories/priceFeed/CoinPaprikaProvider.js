class CoinPaprikaProvider {
  async fetchPrices() {
    const [xrpRes, xlmRes] = await Promise.all([
      fetch("https://api.coinpaprika.com/v1/tickers/xrp-xrp"),
      fetch("https://api.coinpaprika.com/v1/tickers/xlm-stellar"),
    ]);
    if (!xrpRes.ok || !xlmRes.ok) throw new Error("CoinPaprika API error");
    const xrp = await xrpRes.json();
    const xlm = await xlmRes.json();
    const usdToInr = 83;
    return {
      xrp: {
        usd: xrp.quotes.USD.price,
        inr: xrp.quotes.USD.price * usdToInr,
        change24h: xrp.quotes.USD.percent_change_24h || 0,
      },
      xlm: {
        usd: xlm.quotes.USD.price,
        inr: xlm.quotes.USD.price * usdToInr,
        change24h: xlm.quotes.USD.percent_change_24h || 0,
      },
      updatedAt: new Date().toISOString(),
    };
  }
}

module.exports = CoinPaprikaProvider;
