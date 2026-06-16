import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { RiDeleteBinLine } from "react-icons/ri";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useCart, useDispatchCart } from "../components/ContextReducer";
import ApiClient from "../factories/api/ApiClient";
import API_BASE_URL from "../config";
import { useCrypto } from "../contexts/CryptoContext";
import { useAuth } from "../contexts/AuthContext";
import { useWallet } from "../hooks/useWallet";
import AccountAlertsPanel from "../components/AccountAlertsPanel";

export default function Checkout() {
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [checkingOut, setCheckingOut] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");
  const [merchant, setMerchant] = useState({ xrp: "", xlm: "" });
  const data = useCart();
  const dispatch = useDispatchCart();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toXrp, toXlm, formatDualPrice, prices, loading: pricesLoading, error: pricesError, refreshPrices } =
    useCrypto();
  const { pay, wallet, ensureConnected, openWalletModal, isConnected, abbreviatedAddress, walletType } = useWallet();

  const activeType = wallet?.walletType || user?.walletType || "gem";
  const hasPrices = Boolean(prices?.xrp?.inr);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/health`)
      .then((r) => r.json())
      .then((d) => setMerchant({ xrp: d.merchantXrp || "", xlm: d.merchantXlm || "" }))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (paymentMethod === "Crypto") refreshPrices();
  }, [paymentMethod, refreshPrices]);

  const handleRemove = (index) => {
    if (window.confirm("Remove this item from your cart?")) {
      dispatch({ type: "REMOVE", index });
    }
  };

  const totalPrice = data.reduce((total, food) => total + food.price, 0);
  const xrpAmount = toXrp(totalPrice);
  const xlmAmount = toXlm(totalPrice);

  const ensureWalletForPayment = async () => {
    try {
      return await ensureConnected();
    } catch {
      throw new Error("Connect your wallet to pay with crypto");
    }
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
        if (!merchantAddress) {
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

      const orderResult = await ApiClient.post("/api/orders", {
        order_data: data,
        order_date: new Date().toDateString(),
        ...paymentMeta,
      });
      dispatch({ type: "DROP" });
      navigate(`/order/success/${orderResult.orderId}`, { state: { order: orderResult } });
    } catch (error) {
      console.error("Checkout error:", error);
      alert(error.message || "Checkout failed");
    } finally {
      setCheckingOut(false);
    }
  };

  if (data.length === 0) {
    return (
      <div className="page-shell">
        <Navbar />
        <main className="page-container-narrow text-center py-20">
          <h1 className="page-title mb-2">Checkout</h1>
          <p className="text-slate-400 mb-8">Your cart is empty</p>
          <Link to="/" className="btn-primary inline-block">
            Browse menu
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page-shell">
      <Navbar />

      <main className="page-container-narrow">
        <header className="page-header">
          <h1 className="page-title">Checkout</h1>
          <p className="page-subtitle">Review your order and complete payment</p>
        </header>

        <div className="section-card-body space-y-6">
          {alertMsg && <p className="alert-info">{alertMsg}</p>}

          <AccountAlertsPanel onMessage={setAlertMsg} />

          <section>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Order items</h2>
            <ul className="divide-y divide-slate-800">
              {data.map((food, index) => (
                <li key={index} className="flex items-center gap-4 py-4 first:pt-0">
                  <img src={food.img} alt={food.name} className="w-16 h-16 rounded-lg object-cover bg-slate-800 shrink-0" />
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
          </section>

          <div className="border-t border-slate-800 pt-5 space-y-4">
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
              <div className="section-card p-4 space-y-2 bg-slate-800/40">
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

                {isConnected ? (
                  <p className="text-xs text-emerald-400">
                    Wallet ready: {abbreviatedAddress} ({activeType === "freighter" ? "XLM" : "XRP"})
                  </p>
                ) : (
                  <button type="button" onClick={openWalletModal} className="btn-secondary text-sm w-full">
                    Connect wallet to pay
                  </button>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={handleCheckOut}
              disabled={checkingOut}
              className="btn-primary w-full py-3 disabled:opacity-60"
            >
              {checkingOut ? "Processing..." : "Place Order"}
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
