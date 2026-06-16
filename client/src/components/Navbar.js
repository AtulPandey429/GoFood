import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useCart } from "./ContextReducer";
import { useAuth } from "../contexts/AuthContext";
import { useCrypto } from "../contexts/CryptoContext";
import WalletButton from "./WalletButton";
import CryptoTicker from "./CryptoTicker";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { token, logout, isAdmin } = useAuth();
  const { prices } = useCrypto();
  const items = useCart();

  const isAdminRoute = location.pathname.startsWith("/admin");
  const closeMenu = () => setMenuOpen(false);

  const navClass = (path) => {
    const active = location.pathname === path;
    return `block px-3 py-2 text-sm rounded-lg transition-colors ${
      active
        ? "text-white bg-slate-800 font-medium"
        : "text-slate-300 hover:text-white hover:bg-slate-800/60"
    }`;
  };

  const customerLinks = (
    <>
      <Link to="/" className={navClass("/")}>Home</Link>
      <Link to="/myOrder" className={navClass("/myOrder")}>Orders</Link>
      <Link to="/notifications" className={navClass("/notifications")}>Alerts</Link>
      {isAdmin && (
        <Link to="/admin" className={navClass("/admin") + " !text-red-400"}>Admin</Link>
      )}
    </>
  );

  const adminLinks = (
    <>
      <Link to="/admin" className={navClass("/admin") + " !text-red-400"}>Dashboard</Link>
      <Link to="/" className={navClass("/")}>View Menu</Link>
    </>
  );

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="h-14 flex items-center justify-between gap-3">
          <Link
            to={isAdminRoute ? "/admin" : "/"}
            className="text-xl font-bold text-red-500 hover:text-red-400 shrink-0"
          >
            GoFood
            {isAdminRoute && <span className="text-slate-500 font-normal text-sm ml-1.5">Admin</span>}
          </Link>

          <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {token && (isAdminRoute ? adminLinks : customerLinks)}
            {!token && <Link to="/" className={navClass("/")}>Home</Link>}
          </div>

          <div className="hidden md:flex items-center gap-2 shrink-0">
            {!isAdminRoute && <CryptoTicker />}
            {!isAdminRoute && <WalletButton />}
            {!token ? (
              <>
                <Link to="/login" className="btn-secondary text-sm py-1.5 px-3">Login</Link>
                <Link to="/signup" className="btn-primary text-sm py-1.5 px-3">Sign up</Link>
              </>
            ) : (
              <>
                {!isAdminRoute && (
                  <Link to="/checkout" className="btn-primary text-sm py-1.5 px-3 relative">
                    Cart
                    {items.length > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-white text-red-600 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                        {items.length}
                      </span>
                    )}
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => { logout(); navigate("/"); }}
                  className="btn-secondary text-sm py-1.5 px-3 text-slate-300"
                >
                  Logout
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            className="md:hidden p-2 rounded-lg text-slate-300 hover:bg-slate-800"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
            aria-expanded={menuOpen}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {prices?.xrp && (
          <div className="md:hidden flex gap-2 pb-2 overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 shrink-0 text-xs">
              <span className="text-emerald-400 font-bold">XRP</span>
              <span className="text-white">${prices.xrp.usd?.toFixed(4)}</span>
              <span className="text-slate-400">₹{prices.xrp.inr?.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 shrink-0 text-xs">
              <span className="text-sky-400 font-bold">XLM</span>
              <span className="text-white">${prices.xlm?.usd?.toFixed(4)}</span>
              <span className="text-slate-400">₹{prices.xlm?.inr?.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-slate-800 px-4 py-4 space-y-1 bg-slate-900">
          {token ? (
            isAdminRoute ? (
              <>
                <Link to="/admin" className={navClass("/admin")} onClick={closeMenu}>Dashboard</Link>
                <Link to="/" className={navClass("/")} onClick={closeMenu}>View Menu</Link>
              </>
            ) : (
              <>
                <Link to="/" className={navClass("/")} onClick={closeMenu}>Home</Link>
                <Link to="/myOrder" className={navClass("/myOrder")} onClick={closeMenu}>Orders</Link>
                <Link to="/notifications" className={navClass("/notifications")} onClick={closeMenu}>Alerts</Link>
                <Link to="/checkout" className={navClass("/checkout")} onClick={closeMenu}>
                  Cart {items.length > 0 && `(${items.length})`}
                </Link>
                {isAdmin && (
                  <Link to="/admin" className={navClass("/admin")} onClick={closeMenu}>Admin</Link>
                )}
              </>
            )
          ) : (
            <Link to="/" className={navClass("/")} onClick={closeMenu}>Home</Link>
          )}
          {!isAdminRoute && (
            <div className="pt-3">
              <WalletButton stacked />
            </div>
          )}
          {!token ? (
            <div className="flex gap-2 pt-2">
              <Link to="/login" className="btn-secondary flex-1 text-center text-sm py-2" onClick={closeMenu}>Login</Link>
              <Link to="/signup" className="btn-primary flex-1 text-center text-sm py-2" onClick={closeMenu}>Sign up</Link>
            </div>
          ) : (
            <button
              type="button"
              className="w-full mt-2 btn-secondary text-sm py-2 text-red-400"
              onClick={() => { logout(); navigate("/"); closeMenu(); }}
            >
              Logout
            </button>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
