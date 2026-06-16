import React, { useState } from "react";
import { abbreviateHash, copyToClipboard, getTxExplorerUrl } from "../utils/blockExplorer";

const TxHashDisplay = ({ txHash, cryptoAsset, cryptoNetwork = "mainnet", className = "" }) => {
  const [copied, setCopied] = useState(false);

  if (!txHash) return null;

  const explorerUrl = getTxExplorerUrl({ cryptoAsset, txHash, cryptoNetwork });

  const handleCopy = async () => {
    const ok = await copyToClipboard(txHash);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 text-sm ${className}`}>
      <span className="text-slate-400">Txn:</span>
      <code className="text-slate-200 bg-slate-800 px-2 py-0.5 rounded font-mono text-xs">
        {abbreviateHash(txHash)}
      </code>
      <button
        type="button"
        onClick={handleCopy}
        className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
      >
        {copied ? "Copied" : "Copy"}
      </button>
      {explorerUrl && (
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          View on explorer
        </a>
      )}
    </div>
  );
};

export default TxHashDisplay;
