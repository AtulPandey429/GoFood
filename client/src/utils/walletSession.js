const STORAGE_KEY = "gofood_wallet_session";

export function readWalletSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.walletType || !data?.address) return null;
    if (!["gem", "freighter"].includes(data.walletType)) return null;
    return data;
  } catch {
    return null;
  }
}

export function saveWalletSession({ walletType, address, publicKey }) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      walletType,
      address,
      publicKey: publicKey || null,
      connectedAt: Date.now(),
    })
  );
}

export function clearWalletSession() {
  localStorage.removeItem(STORAGE_KEY);
}
