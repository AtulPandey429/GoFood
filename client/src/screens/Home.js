import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Card from "../components/Card";
import ApiClient from "../factories/api/ApiClient";

const Home = () => {
  const [search, setSearch] = useState("");
  const [foodItem, setFoodItem] = useState([]);
  const [foodCategory, setFoodCategory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ApiClient.post("/api/display/fooditems", {})
      .then((data) => {
        setFoodItem(data[0] || []);
        setFoodCategory(data[1] || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />

      {/* Hero */}
      <section className="relative h-72 md:h-96 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200"
          alt="Food banner"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/50 to-slate-950" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            Order food with <span className="text-red-500">GoFood</span>
          </h1>
          <p className="text-slate-300 mb-6 max-w-md">
            Pay with cash or crypto · Live XRP prices
          </p>
          <div className="w-full max-w-md">
            <input
              type="search"
              placeholder="Search dishes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field text-center"
            />
          </div>
        </div>
      </section>

      {/* Menu */}
      <main className="max-w-7xl mx-auto px-4 py-10">
        {loading ? (
          <div className="text-center text-slate-400 py-20">Loading menu...</div>
        ) : (
          foodCategory.map((cat, idx) => {
            const items = foodItem.filter(
              (item) =>
                item.CategoryName === cat.CategoryName &&
                item.name.toLowerCase().includes(search.toLowerCase())
            );
            if (items.length === 0) return null;
            return (
              <section key={cat._id || cat.CategoryName || idx} className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-1">{cat.CategoryName}</h2>
                <div className="h-1 w-16 bg-red-500 rounded mb-6" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {items.map((item, i) => (
                    <Card key={item._id || item.id || i} foodItem={item} />
                  ))}
                </div>
              </section>
            );
          })
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Home;
