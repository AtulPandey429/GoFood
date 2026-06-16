export const abbreviateHash = (hash, start = 8, end = 8) => {
  if (!hash || hash.length <= start + end + 3) return hash || "";
  return `${hash.slice(0, start)}...${hash.slice(-end)}`;
};

export const abbreviateOrderId = (orderId) => abbreviateHash(orderId, 8, 4);

export const getTxExplorerUrl = ({ cryptoAsset, txHash, cryptoNetwork = "mainnet" }) => {
  if (!txHash) return null;
  const network = cryptoNetwork === "testnet" ? "testnet" : "mainnet";
  const asset = (cryptoAsset || "").toUpperCase();

  if (asset === "XRP") {
    const base = network === "testnet" ? "https://testnet.xrpl.org" : "https://livenet.xrpl.org";
    return `${base}/transactions/${txHash}`;
  }
  if (asset === "XLM") {
    const segment = network === "testnet" ? "testnet" : "public";
    return `https://stellar.expert/explorer/${segment}/tx/${txHash}`;
  }
  return null;
};

export const copyToClipboard = async (text) => {
  if (!text) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  }
};
