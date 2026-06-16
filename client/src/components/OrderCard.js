import React from "react";
import TxHashDisplay from "./TxHashDisplay";
import { abbreviateOrderId } from "../utils/blockExplorer";

const statusBadge = (status, type) => {
  const colors = {
    delivery: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    paid: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    pending: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    failed: "bg-red-500/20 text-red-300 border-red-500/30",
    crypto: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  };
  let key = "pending";
  if (type === "payment") {
    if (status === "Paid") key = "paid";
    else if (status === "Failed") key = "failed";
    else key = "pending";
  } else if (type === "crypto") {
    key = "crypto";
  } else {
    key = "delivery";
  }
  return `inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${colors[key]}`;
};

const OrderCard = ({ order, cryptoNetwork = "mainnet" }) => {
  const {
    orderId,
    orderDate,
    items = [],
    paymentMethod,
    paymentStatus,
    deliveryStatus,
    cryptoAsset,
    cryptoAmount,
    txHash,
    verificationNote,
    totalInr,
  } = order;

  return (
    <article className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <header className="px-5 py-4 border-b border-slate-800 flex flex-wrap items-center gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-500">Order ref</p>
          <p className="text-sm font-mono text-white truncate" title={orderId}>
            {abbreviateOrderId(orderId)}
          </p>
        </div>
        {orderDate && <span className="text-sm text-slate-400">{orderDate}</span>}
        {deliveryStatus && (
          <span className={statusBadge(deliveryStatus, "delivery")}>{deliveryStatus}</span>
        )}
        {paymentStatus && (
          <span className={statusBadge(paymentStatus, "payment")}>{paymentStatus}</span>
        )}
      </header>

      <div className="px-5 py-4 space-y-3">
        <ul className="divide-y divide-slate-800">
          {items.map((item, i) => (
            <li key={i} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              {item.img && (
                <img src={item.img} alt={item.name} className="w-12 h-12 rounded-lg object-cover bg-slate-800" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{item.name}</p>
                <p className="text-xs text-slate-400">
                  {item.size} · Qty {item.qty}
                </p>
              </div>
              <p className="text-red-400 font-semibold whitespace-nowrap">₹{item.price}</p>
            </li>
          ))}
        </ul>

        <div className="flex justify-between items-center pt-2 border-t border-slate-800">
          <span className="text-slate-400 text-sm">Total</span>
          <span className="text-lg font-bold text-white">₹{totalInr ?? items.reduce((s, i) => s + (i.price || 0), 0)}</span>
        </div>

        <div className="pt-2 space-y-2 border-t border-slate-800">
          <p className="text-sm text-slate-400">
            Payment: <span className="text-slate-200">{paymentMethod}</span>
            {paymentMethod === "Crypto" && cryptoAmount > 0 && (
              <span className="ml-2 text-amber-300">
                {Number(cryptoAmount).toFixed(2)} {cryptoAsset}
              </span>
            )}
          </p>

          {paymentMethod === "Crypto" && txHash && (
            <TxHashDisplay txHash={txHash} cryptoAsset={cryptoAsset} cryptoNetwork={cryptoNetwork} />
          )}

          {verificationNote && paymentStatus !== "Paid" && (
            <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
              {verificationNote}
            </p>
          )}
        </div>
      </div>
    </article>
  );
};

export default OrderCard;
