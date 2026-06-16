import { useWallet } from "../hooks/useWallet";
import { WALLET_PROVIDERS } from "../constants/walletProviders";

function WalletIcon({ type }) {
  if (type === "gem") {
    return (
      <svg viewBox="0 0 48 48" className="w-10 h-10" aria-hidden>
        <defs>
          <linearGradient id="gemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
        <polygon points="24,4 44,18 24,44 4,18" fill="url(#gemGrad)" />
        <polygon points="24,4 44,18 24,24 4,18" fill="#6ee7b7" opacity="0.5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 48 48" className="w-10 h-10" aria-hidden>
      <circle cx="24" cy="24" r="20" fill="#7c3aed" />
      <path
        d="M14 24 L24 14 L34 24 L24 34 Z"
        fill="none"
        stroke="#fff"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function WalletConnectModal() {
  const {
    modalOpen,
    closeWalletModal,
    connectWallet,
    connecting,
    connectingType,
    error,
  } = useWallet();

  if (!modalOpen) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={closeWalletModal}
        aria-label="Close wallet modal"
      />
      <div
        className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wallet-modal-title"
      >
        <div className="px-6 pt-6 pb-4 border-b border-slate-800">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="wallet-modal-title" className="text-xl font-bold text-white">
                Connect wallet
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Choose Gem for XRP or Freighter for Stellar. Stay connected across the app.
              </p>
            </div>
            <button
              type="button"
              onClick={closeWalletModal}
              className="w-8 h-8 shrink-0 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-3">
          {WALLET_PROVIDERS.map((provider) => {
            const busy = connecting && connectingType === provider.id;
            return (
              <button
                key={provider.id}
                type="button"
                disabled={connecting}
                onClick={() => connectWallet(provider.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border bg-gradient-to-br ${provider.accent} hover:brightness-110 disabled:opacity-60 transition-all text-left`}
              >
                <div className="shrink-0 w-12 h-12 rounded-xl bg-slate-900/60 flex items-center justify-center">
                  <WalletIcon type={provider.icon} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white">{provider.name}</p>
                  <p className="text-xs text-slate-400">{provider.description}</p>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 mt-0.5">
                    {provider.chain} · {provider.asset}
                  </p>
                </div>
                <span className="text-xs text-slate-400 shrink-0">
                  {busy ? "Connecting…" : "→"}
                </span>
              </button>
            );
          })}
        </div>

        {error && (
          <p className="px-6 pb-4 text-sm text-red-400">{error}</p>
        )}

        <p className="px-6 pb-6 text-[11px] text-slate-500 text-center">
          Install the browser extension if prompted. Gem login needs 2 approvals (connect + sign).
        </p>
      </div>
    </div>
  );
}
