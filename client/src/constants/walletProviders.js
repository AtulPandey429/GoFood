export const WALLET_PROVIDERS = [
  {
    id: "gem",
    name: "Gem Wallet",
    chain: "XRP Ledger",
    asset: "XRP",
    description: "Pay with XRP on XRPL",
    accent: "from-emerald-500/20 to-teal-600/10 border-emerald-500/40",
    icon: "gem",
  },
  {
    id: "freighter",
    name: "Freighter",
    chain: "Stellar",
    asset: "XLM",
    description: "Pay with XLM on Stellar",
    accent: "from-violet-500/20 to-indigo-600/10 border-violet-500/40",
    icon: "freighter",
  },
];

export function getWalletProvider(id) {
  return WALLET_PROVIDERS.find((p) => p.id === id);
}
