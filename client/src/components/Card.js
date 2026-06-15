import React, { useState, useMemo } from "react";
import { useDispatchCart, useCart } from "./ContextReducer";
import { useNavigate } from "react-router-dom";
import { useCrypto } from "../contexts/CryptoContext";
import { parseFoodOptions, getUnitPrice, calcLineTotal } from "../utils/foodPrice";

const Card = ({ foodItem }) => {
  const { sizes, defaultKey } = useMemo(
    () => parseFoodOptions(foodItem?.options, foodItem?.price),
    [foodItem?.options, foodItem?.price]
  );

  const data = useCart();
  const dispatch = useDispatchCart();
  const navigate = useNavigate();
  const { formatDualPrice } = useCrypto();

  const [qty, setQty] = useState(1);
  const [sizeKey, setSizeKey] = useState(defaultKey);
  const [isAdded, setIsAdded] = useState(false);

  const unitPrice = getUnitPrice(sizes, sizeKey);
  const finalPrice = calcLineTotal(qty, unitPrice);
  const selectedLabel = sizes.find((s) => s.key === sizeKey)?.label || "Regular";

  const handleAddToCart = () => {
    if (!localStorage.getItem("authToken")) {
      navigate("/login");
      return;
    }
    const itemId = foodItem._id || foodItem.id;
    const existingItem = data.find(
      (item) => item.id === itemId && item.size === selectedLabel
    );

    if (existingItem) {
      dispatch({ type: "UPDATE", id: itemId, price: finalPrice, qty, size: selectedLabel });
    } else {
      dispatch({
        type: "ADD",
        id: itemId,
        name: foodItem.name,
        price: finalPrice,
        img: foodItem.img,
        qty,
        size: selectedLabel,
      });
    }
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <div className="group bg-slate-800/80 backdrop-blur border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-red-500/10 hover:border-slate-600 transition-all duration-300 hover:-translate-y-1">
      <div className="relative h-44 overflow-hidden">
        <img
          src={foodItem.img}
          alt={foodItem.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
        <span className="absolute bottom-2 left-3 text-xs font-medium bg-red-500/90 text-white px-2 py-0.5 rounded-full">
          {foodItem.CategoryName}
        </span>
      </div>

      <div className="p-4 space-y-3">
        <h3 className="text-lg font-semibold text-white truncate">{foodItem.name}</h3>
        {foodItem.description && (
          <p className="text-sm text-slate-400 line-clamp-2">{foodItem.description}</p>
        )}

        <div className="flex gap-2">
          <select
            className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-2 py-2 text-sm text-white focus:ring-2 focus:ring-red-500 focus:outline-none"
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
          >
            {Array.from({ length: 6 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                Qty: {i + 1}
              </option>
            ))}
          </select>
          <select
            className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-2 py-2 text-sm text-white focus:ring-2 focus:ring-red-500 focus:outline-none"
            value={sizeKey}
            onChange={(e) => setSizeKey(e.target.value)}
          >
            {sizes.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="pt-1">
          <p className="text-2xl font-bold text-white">{formatDualPrice(finalPrice)}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            ₹{unitPrice} × {qty} · {selectedLabel}
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all ${
            isAdded
              ? "bg-emerald-500 text-white"
              : "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25"
          }`}
        >
          {isAdded ? "✓ Added to Cart" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
};

export default Card;
