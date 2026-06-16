import React, { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { FiCheckCircle } from "react-icons/fi";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import TxHashDisplay from "../components/TxHashDisplay";
import ApiClient from "../factories/api/ApiClient";
import API_BASE_URL from "../config";
import { abbreviateOrderId, copyToClipboard } from "../utils/blockExplorer";

const paymentBadge = (status) => {
  if (status === "Paid") return "badge-emerald";
  if (status === "Failed") return "badge-red";
  return "badge-amber";
};

const OrderSuccess = () => {
  const { orderId } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!location.state?.order);
  const [error, setError] = useState("");
  const [cryptoNetwork, setCryptoNetwork] = useState("mainnet");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/health`)
      .then((r) => r.json())
      .then((d) => setCryptoNetwork(d.cryptoNetwork || "mainnet"))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (location.state?.order) {
      setOrder(location.state.order);
      setLoading(false);
      return;
    }

    ApiClient.get(`/api/orders/${orderId}`)
      .then((data) => setOrder(data))
      .catch((e) => setError(e.message || "Could not load order"))
      .finally(() => setLoading(false));
  }, [orderId, location.state]);

  const handleCopyRef = async () => {
    if (!order?.orderId) return;
    const ok = await copyToClipboard(order.orderId);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="page-shell">
        <Navbar />
        <main className="page-container-narrow text-center py-20 text-slate-400">Loading order…</main>
        <Footer />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="page-shell">
        <Navbar />
        <main className="page-container-narrow text-center py-20">
          <p className="text-red-400 mb-6">{error || "Order not found"}</p>
          <Link to="/myOrder" className="btn-primary inline-block">View my orders</Link>
        </main>
        <Footer />
      </div>
    );
  }

  const items = order.items || [];
  const totalInr = order.totalInr ?? items.reduce((s, i) => s + (i.price || 0), 0);

  return (
    <div className="page-shell">
      <Navbar />

      <main className="page-container-narrow">
        <div className="text-center mb-8">
          <FiCheckCircle className="mx-auto text-emerald-400 mb-4" size={56} />
          <h1 className="page-title mb-2">Order placed</h1>
          <p className="page-subtitle">Thank you! Your order has been received.</p>
        </div>

        <div className="section-card-body space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs text-slate-500">Order reference</p>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono text-white" title={order.orderId}>
                  {abbreviateOrderId(order.orderId)}
                </code>
                <button type="button" onClick={handleCopyRef} className="text-xs text-blue-400 hover:text-blue-300">
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
            {order.orderDate && <span className="text-sm text-slate-400">{order.orderDate}</span>}
          </div>

          <div className="flex flex-wrap gap-2">
            {order.deliveryStatus && <span className="badge-blue">{order.deliveryStatus}</span>}
            {order.paymentStatus && (
              <span className={paymentBadge(order.paymentStatus)}>{order.paymentStatus}</span>
            )}
          </div>

          {order.paymentMethod === "Crypto" && order.txHash && (
            <TxHashDisplay
              txHash={order.txHash}
              cryptoAsset={order.cryptoAsset}
              cryptoNetwork={cryptoNetwork}
            />
          )}

          {order.verificationNote && order.paymentStatus !== "Paid" && (
            <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
              {order.verificationNote}
              <span className="block mt-1 text-slate-400">
                Payment status updates automatically — check My Orders for the latest status.
              </span>
            </p>
          )}

          <section>
            <h2 className="text-sm font-medium text-slate-400 mb-3">Items</h2>
            <ul className="divide-y divide-slate-800">
              {items.map((item, i) => (
                <li key={i} className="flex justify-between py-2 text-sm">
                  <span className="text-slate-300">
                    {item.name} <span className="text-slate-500">× {item.qty}</span>
                  </span>
                  <span className="text-white">₹{item.price}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between pt-3 mt-2 border-t border-slate-800">
              <span className="text-slate-400">Total</span>
              <span className="text-lg font-bold text-white">₹{totalInr}</span>
            </div>
          </section>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link to="/myOrder" className="btn-primary text-center flex-1 py-2.5">
              View my orders
            </Link>
            <Link to="/" className="btn-secondary text-center flex-1 py-2.5">
              Continue shopping
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OrderSuccess;
