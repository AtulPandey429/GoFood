import React, { useEffect, useState, useCallback } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import OrderCard from "../components/OrderCard";
import ApiClient from "../factories/api/ApiClient";
import API_BASE_URL from "../config";

const MyOrder = () => {
  const [orders, setOrders] = useState([]);
  const [cryptoNetwork, setCryptoNetwork] = useState("mainnet");

  const fetchMyOrder = useCallback(async () => {
    try {
      const response = await ApiClient.post("/api/orders/history", {});
      setOrders(response.orders || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  }, []);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/health`)
      .then((r) => r.json())
      .then((d) => setCryptoNetwork(d.cryptoNetwork || "mainnet"))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchMyOrder();

    const token = localStorage.getItem("authToken");
    if (!token) return undefined;

    const eventSource = new EventSource(
      `${API_BASE_URL}/api/events/orders?token=${encodeURIComponent(token)}`
    );

    eventSource.addEventListener("order", () => {
      fetchMyOrder();
    });

    eventSource.onerror = () => eventSource.close();

    return () => eventSource.close();
  }, [fetchMyOrder]);

  return (
    <div className="page-shell">
      <Navbar />

      <main className="page-container-narrow">
        <header className="page-header">
          <h1 className="page-title">My Orders</h1>
          <p className="page-subtitle">
            Track your past and current orders. Crypto payments include transaction hash and explorer links.
          </p>
        </header>

        {orders.length === 0 ? (
          <div className="section-card-body text-center py-20 text-slate-500">
            No orders yet — add items from the menu and checkout.
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <OrderCard key={order.orderId} order={order} cryptoNetwork={cryptoNetwork} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default MyOrder;
