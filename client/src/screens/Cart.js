import React, { useState, useEffect } from "react";
import { RiDeleteBinLine } from "react-icons/ri";
import { useCart, useDispatchCart } from "../components/ContextReducer";
import ApiClient from "../factories/api/ApiClient";
import API_BASE_URL from "../config";
import { useCrypto } from "../contexts/CryptoContext";
import { useAuth } from "../contexts/AuthContext";
import { useWallet } from "../hooks/useWallet";
import AccountAlertsPanel from "../components/AccountAlertsPanel";

export default function Cart() {
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [checkingOut, setCheckingOut] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");
  const [merchant, setMerchant] = useState({ xrp: "", xlm: "" });
  const data = useCart();
  const dispatch = useDispatchCart();
  const { user } = useAuth();
  const { toXrp, toXlm, formatDualPrice, prices, loading: pricesLoading, error: pricesError, refreshPrices } =
    useCrypto();
  const { pay, wallet, connectForPayment, connecting, abbreviatedAddress } = useWallet();

  const walletType = wallet?.walletType || user?.walletType || "gem";
  const walletAddress = wallet?.address || user?.walletAddress;
  const walletKnown = Boolean(walletAddress);
  const walletReady = Boolean(wallet?.adapter);
  const hasPrices = Boolean(prices?.xrp?.inr);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/health`)
      .then((r) => r.json())
      .then((d) => setMerchant({ xrp: d.merchantXrp || "", xlm: d.merchantXlm || "" }))
      .catch(() => {});
  }, []);

  // Load prices when user opens crypto payment
  useEffect(() => {
    if (paymentMethod === "Crypto") refreshPrices();
  }, [paymentMethod, refreshPrices]);

  // Wallet logged-in user: attach extension once when crypto payment is selected
  useEffect(() => {
    if (paymentMethod !== "Crypto" || walletReady || connecting || !walletKnown) return;
    connectForPayment(walletType).catch(() => {});
  }, [paymentMethod, walletReady, connecting, walletKnown, walletType, connectForPayment]);

  const handleRemove = (index) => {
    if (window.confirm("Remove this item from your cart?")) {
      dispatch({ type: "REMOVE", index });
    }
  };

  const totalPrice = data.reduce((total, food) => total + food.price, 0);
  const xrpAmount = toXrp(totalPrice);
  const xlmAmount = toXlm(totalPrice);

  const ensureWalletForPayment = async () => {
    if (wallet?.adapter) return wallet;
    return connectForPayment(walletType);
  };

  const ensurePrices = async () => {
    if (prices?.xrp?.inr) return prices;
    const fresh = await refreshPrices();
    if (!fresh?.xrp?.inr) {
      throw new Error("Crypto prices unavailable — check connection and retry");
    }
    return fresh;
  };

  const handleCheckOut = async () => {
    setCheckingOut(true);
    try {
      let paymentMeta = { paymentMethod: "Cash", cryptoAsset: "None", cryptoAmount: 0, txHash: "" };

      if (paymentMethod === "Crypto") {
        await ensurePrices();
        const activeWallet = await ensureWalletForPayment();

        const asset = activeWallet.walletType === "freighter" ? "XLM" : "XRP";
        const merchantAddress = asset === "XLM" ? merchant.xlm : merchant.xrp;
        if (!merchantAddress && activeWallet.walletType !== "sandbox") {
          throw new Error("Set MERCHANT_XRP_ADDRESS in server .env");
        }

        const rawCrypto = asset === "XLM" ? toXlm(totalPrice) : toXrp(totalPrice);
        const cryptoAmount = Math.round(Number(rawCrypto) * 100) / 100;
        if (!cryptoAmount || cryptoAmount <= 0) {
          throw new Error("Could not calculate crypto amount — refresh prices and try again");
        }

        const result = await pay({
          amount: cryptoAmount,
          asset,
          to: merchantAddress || activeWallet.address,
          walletOverride: activeWallet,
        });
        paymentMeta = {
          paymentMethod: "Crypto",
          cryptoAsset: asset,
          cryptoAmount,
          txHash: result.txHash,
          fromAddress: activeWallet.address || "",
        };
      }

      await ApiClient.post("/api/orders", {
        order_data: data,
        order_date: new Date().toDateString(),
        ...paymentMeta,
      });
      dispatch({ type: "DROP" });
      alert("Order placed successfully!");
    } catch (error) {
      console.error("Checkout error:", error);
      alert(error.message || "Checkout failed");
    } finally {
      setCheckingOut(false);
    }
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400 text-lg">Your cart is empty</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {alertMsg && (
        <p className="text-xs text-blue-300 bg-blue-500/10 border border-blue-500/30 rounded-lg px-3 py-2">
          {alertMsg}
        </p>
      )}

      <AccountAlertsPanel onMessage={setAlertMsg} />

      <ul className="divide-y divide-slate-800">
        {data.map((food, index) => (
          <li key={index} className="flex items-center gap-4 py-4 first:pt-0">
            <img src={food.img} alt={food.name} className="w-16 h-16 rounded-lg object-cover bg-slate-800" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white truncate">{food.name}</p>
              <p className="text-sm text-slate-400">{food.size} · Qty {food.qty}</p>
            </div>
            <p className="text-white font-semibold whitespace-nowrap">{formatDualPrice(food.price)}</p>
            <button type="button" onClick={() => handleRemove(index)} className="p-2 text-slate-400 hover:text-red-400">
              <RiDeleteBinLine size={20} />
            </button>
          </li>
        ))}
      </ul>

      <div className="border-t border-slate-800 pt-4 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-slate-400">Total</span>
          <span className="text-2xl font-bold text-white">{formatDualPrice(totalPrice)}</span>
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-2">Payment method</label>
          <select className="input-field" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <option value="Cash">Cash on Delivery</option>
            <option value="Crypto">Pay with Crypto Wallet</option>
          </select>
        </div>

        {paymentMethod === "Crypto" && (
          <div className="space-y-2">
            {hasPrices ? (
              <p className="text-sm text-blue-400">
                Pay ~{xrpAmount.toFixed(4)} XRP or ~{xlmAmount.toFixed(4)} XLM
              </p>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-sm text-amber-400 flex-1">
                  {pricesLoading ? "Loading crypto prices..." : pricesError || "Prices not loaded"}
                </p>
                <button type="button" onClick={refreshPrices} className="btn-secondary text-xs py-1 px-2">
                  Retry
                </button>
              </div>
            )}

            {connecting ? (
              <p className="text-xs text-slate-400">Opening {walletType} wallet — approve the popup...</p>
            ) : walletReady ? (
              <p className="text-xs text-emerald-400">
                Wallet ready: {abbreviatedAddress} ({walletType})
              </p>
            ) : walletKnown ? (
              <button
                type="button"
                onClick={() => connectForPayment(walletType)}
                className="btn-secondary text-sm w-full"
              >
                Approve {walletType} for payment
              </button>
            ) : null}
          </div>
        )}

        <button
          type="button"
          onClick={handleCheckOut}
          disabled={checkingOut || connecting}
          className="btn-primary w-full py-3 disabled:opacity-60"
        >
          {checkingOut ? "Processing..." : "Place Order"}
        </button>
      </div>
    </div>
  );
}
