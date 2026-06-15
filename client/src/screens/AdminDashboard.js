import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import ApiClient from "../factories/api/ApiClient";
import "./AdminDashboard.css";

const RevenueChart = ({ data }) => {
  if (!data || data.length === 0) return <p className="text-muted">No revenue data yet</p>;
  const max = Math.max(...data.map((d) => d.revenue), 1);
  const w = 600;
  const h = 180;
  const points = data.map((d, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * w;
    const y = h - (d.revenue / max) * (h - 20);
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="chart-svg">
      <polyline fill="none" stroke="#00ff88" strokeWidth="2" points={points} />
      <polygon fill="rgba(0,255,136,0.1)" points={`0,${h} ${points} ${w},${h}`} />
    </svg>
  );
};

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [foodItems, setFoodItems] = useState([]);
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [newFood, setNewFood] = useState({ name: "", CategoryName: "Pizza", price: 0, img: "", description: "" });

  const loadData = async () => {
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
    }
  };

  useEffect(() => { loadData(); }, []);

  const updateStatus = async (orderId, deliveryStatus) => {
    try {
      await ApiClient.patch(`/api/admin/orders/${orderId}/status`, { deliveryStatus });
      loadData();
    } catch (e) {
      alert(e.message);
    }
  };

  const addFood = async () => {
    try {
      await ApiClient.post("/api/admin/food-items", {
        ...newFood,
        options: [
          { label: "Full", price: newFood.price },
          { label: "Half", price: Math.round(newFood.price * 0.55) },
        ],
      });
      setShowFoodModal(false);
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
    <div className="admin-dashboard">
      <Navbar />
      <h2 className="mb-4">Admin Dashboard</h2>

      <div className="row g-3 mb-4">
        {[
          { label: "Total Revenue", value: `₹${stats?.totalRevenueInr?.toFixed(0) || 0}` },
          { label: "Total Orders", value: stats?.totalOrders || 0 },
          { label: "Active Users", value: stats?.totalUsers || 0 },
          { label: "XRP Revenue", value: `${stats?.totalRevenueXrp?.toFixed(4) || 0} XRP` },
        ].map((s) => (
          <div key={s.label} className="col-md-3">
            <div className="glass-card text-center">
              <div className="text-muted small">{s.label}</div>
              <div className="stat-value">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card mb-4">
        <h5>Revenue Chart</h5>
        <RevenueChart data={stats?.chartData} />
      </div>

      <div className="glass-card mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5>Recent Orders</h5>
        </div>
        <table className="table admin-table text-white">
          <thead>
            <tr><th>Order ID</th><th>Email</th><th>Payment</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.orderId}>
                <td><small>{o.orderId?.slice(0, 8)}...</small></td>
                <td>{o.email}</td>
                <td>{o.metadata?.paymentMethod}{o.metadata?.cryptoAsset !== "None" ? ` (${o.metadata?.cryptoAsset})` : ""}</td>
                <td><span className="badge bg-info">{o.metadata?.deliveryStatus}</span></td>
                <td>
                  {["Preparing", "Dispatched", "Delivered"].map((s) => (
                    <button key={s} className="neon-btn me-1 mb-1" onClick={() => updateStatus(o.orderId, s)}>{s}</button>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="row g-3">
        <div className="col-md-6">
          <div className="glass-card">
            <div className="d-flex justify-content-between mb-3">
              <h5>Food Menu</h5>
              <button className="neon-btn" onClick={() => setShowFoodModal(true)}>+ Add</button>
            </div>
            <table className="table admin-table text-white table-sm">
              <thead><tr><th>Name</th><th>Price</th><th></th></tr></thead>
              <tbody>
                {foodItems.map((f) => (
                  <tr key={f._id || f.id}>
                    <td>{f.name}</td>
                    <td>₹{f.price}</td>
                    <td><button className="btn btn-sm btn-outline-danger" onClick={() => deleteFood(f._id || f.id)}>Del</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="col-md-6">
          <div className="glass-card">
            <h5>Active Users</h5>
            <table className="table admin-table text-white table-sm">
              <thead><tr><th>Name</th><th>Email / Wallet</th><th>Admin</th></tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id || u.id}>
                    <td>{u.name}</td>
                    <td><small>{u.email || u.walletAddress}</small></td>
                    <td>{u.isAdmin ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showFoodModal && (
        <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content bg-dark text-white">
              <div className="modal-header"><h5>Add Food Item</h5></div>
              <div className="modal-body">
                <input className="form-control mb-2" placeholder="Name" value={newFood.name} onChange={(e) => setNewFood({ ...newFood, name: e.target.value })} />
                <input className="form-control mb-2" placeholder="Category" value={newFood.CategoryName} onChange={(e) => setNewFood({ ...newFood, CategoryName: e.target.value })} />
                <input className="form-control mb-2" type="number" placeholder="Price" value={newFood.price} onChange={(e) => setNewFood({ ...newFood, price: Number(e.target.value) })} />
                <input className="form-control mb-2" placeholder="Image URL" value={newFood.img} onChange={(e) => setNewFood({ ...newFood, img: e.target.value })} />
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowFoodModal(false)}>Cancel</button>
                <button className="btn btn-success" onClick={addFood}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
