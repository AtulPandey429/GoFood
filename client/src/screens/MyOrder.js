import React, { useEffect, useState, useCallback } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ApiClient from "../factories/api/ApiClient";
import API_BASE_URL from "../config";

const statusBadge = (status, type) => {
  const colors = {
    delivery: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    paid: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    pending: "bg-slate-500/20 text-slate-300 border-slate-500/30",
    crypto: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  };
  const key = type === "payment" && status === "Paid" ? "paid" : type === "crypto" ? "crypto" : "delivery";
  return `inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${colors[key] || colors.pending}`;
};

const MyOrder = () => {
  const [orderData, setOrderData] = useState({});

  const fetchMyOrder = useCallback(async () => {
    try {
      const response = await ApiClient.post("/api/orders/history", {});
      setOrderData(response);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
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

  const days = orderData?.orderData?.order_data || [];

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-white mb-2">My Orders</h1>
        <p className="text-slate-400 mb-8">Track your past and current orders</p>

        {days.length === 0 ? (
          <div className="text-center py-20 text-slate-500">No orders yet</div>
        ) : (
          days.map((dayData, index) => (
            <section key={index} className="mb-10">
              {dayData[0]?.Order_date && (
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <h2 className="text-lg font-semibold text-white">{dayData[0].Order_date}</h2>
                  {dayData[0].deliveryStatus && (
                    <span className={statusBadge(dayData[0].deliveryStatus, "delivery")}>
                      {dayData[0].deliveryStatus}
                    </span>
                  )}
                  {dayData[0].paymentStatus && (
                    <span className={statusBadge(dayData[0].paymentStatus, "payment")}>
                      {dayData[0].paymentStatus}
                    </span>
                  )}
                  {dayData[0].paymentMethod === "Crypto" && (
                    <span className={statusBadge("", "crypto")}>
                      {dayData[0].cryptoAmount?.toFixed(4)} {dayData[0].cryptoAsset}
                    </span>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {dayData.map((item, innerIndex) =>
                  !item.Order_date && !item.orderId ? (
                    <div
                      key={innerIndex}
                      className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-colors"
                    >
                      <img
                        src={item.img}
                        alt={item.name}
                        className="w-full h-36 object-cover"
                      />
                      <div className="p-4">
                        <h3 className="font-medium text-white truncate">{item.name}</h3>
                        <div className="flex justify-between items-center mt-2 text-sm text-slate-400">
                          <span>Qty {item.qty}</span>
                          <span>{item.size}</span>
                        </div>
                        <p className="mt-2 text-lg font-semibold text-red-400">₹{item.price}</p>
                      </div>
                    </div>
                  ) : null
                )}
              </div>
            </section>
          ))
        )}
      </main>

      <Footer />
    </div>
  );
};

export default MyOrder;
