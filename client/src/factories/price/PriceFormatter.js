const PriceFormatter = {
  formatInr(amount) {
    const n = Number(amount);
    if (!Number.isFinite(n)) return "₹—";
    return `₹${n.toFixed(0)}`;
  },

  formatXrp(amount) {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return "— XRP";
    return `${n.toFixed(4)} XRP`;
  },

  formatXlm(amount) {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return "— XLM";
    return `${n.toFixed(4)} XLM`;
  },

  formatDual(inr, cryptoAmount) {
    const inrStr = this.formatInr(inr);
    const cryptoStr = this.formatXrp(cryptoAmount);
    if (cryptoStr === "— XRP") return inrStr;
    return `${inrStr} (~${cryptoStr})`;
  },

  abbreviateAddress(address) {
    if (!address) return "";
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  },
};

export default PriceFormatter;
