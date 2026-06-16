import React, { useEffect, useState } from "react";
import { useCrypto } from "../contexts/CryptoContext";

const AssetChip = ({ label, color, usd, inr, change }) => {
  const isUp = (change ?? 0) >= 0;
  return (
    <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 shrink-0">
      <span className={`text-[10px] font-bold uppercase tracking-wide ${color}`}>{label}</span>
      <span className="text-xs text-white font-medium tabular-nums">${Number(usd).toFixed(4)}</span>
      <span className="text-[11px] text-slate-400 tabular-nums hidden sm:inline">₹{Number(inr).toFixed(2)}</span>
      {change != null && (
        <span className={`text-[10px] font-medium tabular-nums ${isUp ? "text-emerald-400" : "text-red-400"}`}>
          {isUp ? "▲" : "▼"} {Math.abs(change).toFixed(2)}%
        </span>
      )}
    </div>
  );
};

const CryptoTicker = () => {
  const { prices, priceMeta, loading } = useCrypto();
  const [minutesLeft, setMinutesLeft] = useState(null);

  useEffect(() => {
    if (!priceMeta?.nextUpdateAt) return undefined;

    const tick = () => {
      const ms = priceMeta.nextUpdateAt - Date.now();
      setMinutesLeft(Math.max(0, Math.ceil(ms / 60000)));
    };

    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [priceMeta?.nextUpdateAt]);

  if (loading && !prices?.xrp) {
    return (
      <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-600 animate-pulse" />
        Loading rates…
      </div>
    );
  }

  if (!prices?.xrp) return null;

  return (
    <div className="hidden lg:flex items-center gap-2 min-w-0">
      <AssetChip
        label="XRP"
        color="text-emerald-400"
        usd={prices.xrp.usd}
        inr={prices.xrp.inr}
        change={prices.xrp.change24h}
      />
      <AssetChip
        label="XLM"
        color="text-sky-400"
        usd={prices.xlm?.usd}
        inr={prices.xlm?.inr}
        change={prices.xlm?.change24h}
      />
      {minutesLeft != null && (
        <span className="text-[10px] text-slate-600 whitespace-nowrap" title="Prices refresh every 10 minutes">
          ↻ {minutesLeft}m
        </span>
      )}
    </div>
  );
};

export default CryptoTicker;
