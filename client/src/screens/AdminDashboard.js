import React, { useState, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";
import RevenueChart from "../components/RevenueChart";
import ApiClient from "../factories/api/ApiClient";
import { useAuth } from "../contexts/AuthContext";
import { useAdminLive } from "../hooks/useAdminLive";
import MenuAIAgent from "../components/MenuAIAgent";

const STATUS_FLOW = {
  Placed: "Preparing",
  Preparing: "Dispatched",
  Dispatched: "Delivered",
};

const statusColors = {
  Placed: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Preparing: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  Dispatched: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  Delivered: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
};

const StatCard = ({ label, value, accent, hint }) => (
  <div className="stat-card">
    <p className="stat-label">{label}</p>
    <p className={`stat-value ${accent || ""}`}>{value}</p>
    {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
  </div>
);

const AdminDashboard = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [foodItems, setFoodItems] = useState([]);
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [editingFoodId, setEditingFoodId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newFood, setNewFood] = useState({
    name: "",
    CategoryName: "Pizza",
    price: 0,
    img: "",
    description: "",
  });

  const loadData = useCallback(async () => {
    try {
      const [statsRes, ordersRes, usersRes, foodRes] = await Promise.all([
        ApiClient.get("/api/admin/stats"),
        ApiClient.get("/api/admin/orders"),
        ApiClient.get("/api/admin/users"),
        ApiClient.get("/api/admin/food-items"),
      ]);
      setStats(statsRes);
      setOrders(ordersRes.orders || []);
      setUsers(usersRes.users || []);
      setFoodItems(foodRes.items || []);
    } catch (e) {
      console.error("Admin load error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const { presence, isUserOnline } = useAdminLive(token, loadData);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateStatus = async (orderId, deliveryStatus) => {
    try {
      await ApiClient.patch(`/api/admin/orders/${orderId}/status`, { deliveryStatus });
      loadData();
    } catch (e) {
      alert(e.message);
    }
  };

  const openAddFood = () => {
    setEditingFoodId(null);
    setNewFood({ name: "", CategoryName: "Pizza", price: 0, img: "", description: "" });
    setShowFoodModal(true);
  };

  const applyAgentSuggestion = (item) => {
    setEditingFoodId(null);
    setNewFood({
      name: item.name || "",
      CategoryName: item.CategoryName || "Pizza",
      price: item.price || 0,
      img: item.img || "",
      description: item.description || "",
    });
    setShowFoodModal(true);
  };

  const openEditFood = (item) => {
    setEditingFoodId(item._id || item.id);
    setNewFood({
      name: item.name || "",
      CategoryName: item.CategoryName || "Pizza",
      price: item.price || 0,
      img: item.img || "",
      description: item.description || "",
    });
    setShowFoodModal(true);
  };

  const saveFood = async () => {
    if (!newFood.name.trim()) {
      alert("Food name is required");
      return;
    }
    try {
      const payload = {
        ...newFood,
        options: [
          { label: "Full", price: newFood.price },
          { label: "Half", price: Math.round(newFood.price * 0.55) },
        ],
      };
      if (editingFoodId) {
        await ApiClient.put(`/api/admin/food-items/${editingFoodId}`, payload);
      } else {
        await ApiClient.post("/api/admin/food-items", payload);
      }
      setShowFoodModal(false);
      setEditingFoodId(null);
      setNewFood({ name: "", CategoryName: "Pizza", price: 0, img: "", description: "" });
      loadData();
    } catch (e) {
      alert(e.message);
    }
  };

  const deleteFood = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    await ApiClient.delete(`/api/admin/food-items/${id}`);
    loadData();
  };

  return (
    <div className="page-shell">
      <Navbar />

      <main className="page-container">
        <header className="page-header">
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Manage orders, menu, and users</p>
        </header>

        {loading ? (
          <div className="text-center py-20 text-slate-500">Loading dashboard...</div>
        ) : (
          <div className="space-y-8">
            {/* Stats */}
            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
              <StatCard label="Total Revenue" value={`₹${stats?.totalRevenueInr?.toFixed(0) || 0}`} accent="text-red-400" />
              <StatCard label="Total Orders" value={stats?.totalOrders || 0} />
              <StatCard
                label="Online Now"
                value={presence.onlineCount}
                accent="text-emerald-400"
                hint="Real-time"
              />
              <StatCard label="Registered Users" value={stats?.totalUsers || 0} />
              <StatCard
                label="XRP Revenue"
                value={`${stats?.totalRevenueXrp?.toFixed(4) || 0} XRP`}
                accent="text-amber-400"
              />
            </section>

            <section className="section-card p-5">
              <h2 className="text-lg font-semibold text-white mb-1">Revenue</h2>
              <p className="text-sm text-slate-400 mb-4">Daily INR totals · hover points for details</p>
              <RevenueChart data={stats?.chartData} />
            </section>

            <section className="section-card">
              <div className="section-card-header">
                <h2 className="text-lg font-semibold text-white">Recent Orders</h2>
                <p className="text-sm text-slate-400 mt-0.5">{orders.length} total orders</p>
              </div>
              <div className="overflow-x-auto">
                <table className="data-table min-w-[720px]">
                  <thead>
                    <tr className="text-left text-slate-400 border-b border-slate-800 bg-slate-900/80">
                      <th className="px-5 py-3 font-medium">Order ID</th>
                      <th className="px-5 py-3 font-medium">Customer</th>
                      <th className="px-5 py-3 font-medium">Amount</th>
                      <th className="px-5 py-3 font-medium">Payment</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                          No orders yet
                        </td>
                      </tr>
                    ) : (
                      orders.map((o) => {
                        const status = o.metadata?.deliveryStatus || "Placed";
                        const nextStatus = STATUS_FLOW[status];
                        return (
                          <tr key={o.orderId} className="hover:bg-slate-800/40 transition-colors">
                            <td className="px-5 py-3 font-mono text-xs text-slate-300">
                              {o.orderId?.slice(0, 8)}…
                            </td>
                            <td className="px-5 py-3 text-slate-300 max-w-[200px] truncate font-mono text-xs" title={o.displayIdentity || o.email || o.customerWallet}>
                              {o.displayIdentity || o.email || o.customerWallet || "—"}
                            </td>
                            <td className="px-5 py-3 text-red-400 font-medium">
                              ₹{o.totalInr ?? 0}
                            </td>
                            <td className="px-5 py-3 text-slate-300">
                              {o.metadata?.paymentMethod}
                              {o.metadata?.cryptoAsset && o.metadata.cryptoAsset !== "None" && (
                                <span className="text-amber-400 ml-1">({o.metadata.cryptoAsset})</span>
                              )}
                            </td>
                            <td className="px-5 py-3">
                              <span
                                className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                  statusColors[status] || statusColors.Placed
                                }`}
                              >
                                {status}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              {nextStatus ? (
                                <button
                                  type="button"
                                  onClick={() => updateStatus(o.orderId, nextStatus)}
                                  className="text-xs px-3 py-1.5 rounded-lg border border-red-500/40 text-red-300 hover:bg-red-500/10 transition-colors"
                                >
                                  Mark {nextStatus}
                                </button>
                              ) : (
                                <span className="text-xs text-slate-500">Complete</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Food + AI + Users */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Food Menu */}
              <section className="section-card lg:col-span-2">
                <div className="section-card-header flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-white">Food Menu</h2>
                    <p className="text-sm text-slate-400">{foodItems.length} items</p>
                  </div>
                  <button type="button" onClick={openAddFood} className="btn-primary text-sm py-1.5 px-3">
                    + Add item
                  </button>
                </div>
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="data-table">
                    <thead>
                      <tr className="text-left text-slate-400 border-b border-slate-800 sticky top-0 bg-slate-900">
                        <th className="px-5 py-3 font-medium">Name</th>
                        <th className="px-5 py-3 font-medium">Price</th>
                        <th className="px-5 py-3 font-medium w-28"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {foodItems.map((f) => (
                        <tr key={f._id || f.id} className="hover:bg-slate-800/40">
                          <td className="px-5 py-3 text-white">{f.name}</td>
                          <td className="px-5 py-3 text-red-400 font-medium">₹{f.price}</td>
                          <td className="px-5 py-3 space-x-3">
                            <button
                              type="button"
                              onClick={() => openEditFood(f)}
                              className="text-xs text-sky-400 hover:text-sky-300"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteFood(f._id || f.id)}
                              className="text-xs text-red-400 hover:text-red-300"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <MenuAIAgent
                onApplySuggestion={applyAgentSuggestion}
                onItemCreated={loadData}
              />

              {/* Users */}
              <section className="section-card lg:col-span-3">
                <div className="section-card-header">
                  <h2 className="text-lg font-semibold text-white">Users</h2>
                  <p className="text-sm text-slate-400">
                    {users.length} registered ·{" "}
                    <span className="text-emerald-400">{presence.onlineCount} online</span>
                  </p>
                </div>
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="data-table">
                    <thead>
                      <tr className="text-left text-slate-400 border-b border-slate-800 sticky top-0 bg-slate-900">
                        <th className="px-5 py-3 font-medium">Name</th>
                        <th className="px-5 py-3 font-medium">Email / Wallet</th>
                        <th className="px-5 py-3 font-medium">Status</th>
                        <th className="px-5 py-3 font-medium">Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {users.map((u) => {
                        const online = isUserOnline(u.id);
                        return (
                        <tr key={u._id || u.id} className="hover:bg-slate-800/40">
                          <td className="px-5 py-3 text-white">{u.name}</td>
                          <td className="px-5 py-3 text-slate-400 text-xs max-w-[180px] truncate font-mono" title={u.displayIdentity || u.email || u.walletAddress}>
                            {u.displayIdentity || u.email || u.walletAddress || "—"}
                          </td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center gap-1.5 text-xs ${online ? "text-emerald-400" : "text-slate-500"}`}>
                              <span className={`w-2 h-2 rounded-full ${online ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`} />
                              {online ? "Online" : "Offline"}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <span className={u.role === "admin" ? "badge-red" : "badge-slate"}>
                              {u.role || "user"}
                            </span>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </div>
        )}
      </main>

      {/* Add food modal */}
      {showFoodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-xl">
            <div className="px-6 py-4 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-white">
                {editingFoodId ? "Edit Food Item" : "Add Food Item"}
              </h3>
            </div>
            <div className="px-6 py-4 space-y-3">
              <input
                className="input-field"
                placeholder="Name"
                value={newFood.name}
                onChange={(e) => setNewFood({ ...newFood, name: e.target.value })}
              />
              <input
                className="input-field"
                placeholder="Category"
                value={newFood.CategoryName}
                onChange={(e) => setNewFood({ ...newFood, CategoryName: e.target.value })}
              />
              <input
                className="input-field"
                type="number"
                placeholder="Price (INR)"
                value={newFood.price || ""}
                onChange={(e) => setNewFood({ ...newFood, price: Number(e.target.value) })}
              />
              <input
                className="input-field"
                placeholder="Description"
                value={newFood.description}
                onChange={(e) => setNewFood({ ...newFood, description: e.target.value })}
              />
              <input
                className="input-field"
                placeholder="Image URL"
                value={newFood.img}
                onChange={(e) => setNewFood({ ...newFood, img: e.target.value })}
              />
            </div>
            <div className="px-6 py-4 border-t border-slate-800 flex justify-end gap-3">
              <button type="button" onClick={() => { setShowFoodModal(false); setEditingFoodId(null); }} className="btn-secondary text-sm">
                Cancel
              </button>
              <button type="button" onClick={saveFood} className="btn-primary text-sm">
                {editingFoodId ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
