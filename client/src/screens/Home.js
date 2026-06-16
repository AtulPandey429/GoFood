import React, { useState, useEffect, useMemo } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Card from "../components/Card";
import ApiClient from "../factories/api/ApiClient";

const Home = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
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

  const categories = useMemo(
    () => ["All", ...foodCategory.map((c) => c.CategoryName)],
    [foodCategory]
  );

  const filteredItems = useMemo(() => {
    return foodItem.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        activeCategory === "All" || item.CategoryName === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [foodItem, search, activeCategory]);

  const groupedByCategory = useMemo(() => {
    if (activeCategory !== "All") {
      return [{ name: activeCategory, items: filteredItems }];
    }
    return foodCategory
      .map((cat) => ({
        name: cat.CategoryName,
        items: filteredItems.filter((item) => item.CategoryName === cat.CategoryName),
      }))
      .filter((g) => g.items.length > 0);
  }, [foodCategory, filteredItems, activeCategory]);

  return (
    <div className="page-shell">
      <Navbar />

      <section className="relative h-72 md:h-[22rem] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200"
          alt="Food banner"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/50 to-slate-950" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            Order food with <span className="text-red-500">GoFood</span>
          </h1>
          <p className="text-slate-300 mb-6 max-w-lg text-sm md:text-base">
            Browse local favorites, pay with cash or crypto, and track orders in real time.
          </p>
          <div className="w-full max-w-md relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              placeholder="Search dishes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10 text-center md:text-left"
            />
          </div>
        </div>
      </section>

      <main className="page-container">
        {!loading && categories.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === cat
                    ? "bg-red-500 text-white shadow-lg shadow-red-500/25"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="section-card animate-pulse">
                <div className="h-44 bg-slate-800" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-slate-800 rounded w-3/4" />
                  <div className="h-4 bg-slate-800 rounded w-full" />
                  <div className="h-10 bg-slate-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : groupedByCategory.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-400 text-lg mb-2">No dishes found</p>
            <p className="text-slate-500 text-sm">Try a different search or category</p>
          </div>
        ) : (
          groupedByCategory.map((group) => (
            <section key={group.name} className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-2xl font-bold text-white">{group.name}</h2>
                <span className="badge-slate">{group.items.length} items</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {group.items.map((item, i) => (
                  <Card key={item._id || item.id || i} foodItem={item} />
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Home;
