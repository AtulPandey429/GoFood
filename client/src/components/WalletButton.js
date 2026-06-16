import { useWallet } from "../hooks/useWallet";
import { getWalletProvider } from "../constants/walletProviders";

export default function WalletButton({ stacked = false }) {
  const {
    isConnected,
    abbreviatedAddress,
    walletType,
    connecting,
    openWalletModal,
    disconnect,
  } = useWallet();

  const provider = getWalletProvider(walletType);

  if (isConnected) {
    return (
      <div
        className={`inline-flex items-center rounded-lg border border-slate-700 bg-slate-800/90 overflow-hidden ${
          stacked ? "w-full" : ""
        }`}
      >
        <div
          className={`flex items-center gap-2 px-2.5 py-1.5 min-w-0 ${stacked ? "flex-1 justify-center" : ""}`}
          title={provider ? `${provider.asset} wallet connected` : "Wallet connected"}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
          <span className="text-xs font-mono text-slate-200 truncate">{abbreviatedAddress}</span>
          {provider && (
            <span className="text-[10px] font-semibold uppercase text-slate-500 shrink-0">{provider.asset}</span>
          )}
        </div>
        <button
          type="button"
          onClick={disconnect}
          className="px-2 py-1.5 border-l border-slate-700 text-slate-500 hover:text-red-400 hover:bg-slate-700/50 text-xs transition-colors"
          title="Disconnect wallet"
          aria-label="Disconnect wallet"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={openWalletModal}
      disabled={connecting}
      className={`btn-secondary text-xs py-1.5 ${stacked ? "w-full" : ""} disabled:opacity-60`}
    >
      {connecting ? "Connecting…" : "Wallet"}
    </button>
  );
}
