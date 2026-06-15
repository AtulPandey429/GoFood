import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Modal from "../screens/Modal";
import Cart from "../screens/Cart";
import { useCart } from "./ContextReducer";
import { useAuth } from "../contexts/AuthContext";
import { useCrypto } from "../contexts/CryptoContext";
import { useWallet } from "../hooks/useWallet";

const Navbar = () => {
  const [cartView, setCartView] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { token, logout, user, isAdmin } = useAuth();
  const { prices } = useCrypto();
  const {
    connect,
    connectForPayment,
    disconnect,
    abbreviatedAddress,
    connecting,
    isLinked,
    hasAdapter,
    walletType,
  } = useWallet();
  const items = useCart();

  const handleWalletConnect = async (type) => {
    try {
      await connect(type);
    } catch {
      /* WalletContext stores error */
    }
  };

  const handleReconnect = async (type) => {
    try {
      await connectForPayment(type);
    } catch {
      /* WalletContext stores error */
    }
  };

  const handleWalletDisconnect = () => {
    disconnect();
    if (user?.walletAddress) logout();
  };

  const xrpChange = prices?.xrp?.change24h ?? 0;
  const isUp = xrpChange >= 0;

  return (
    <header className="sticky top-0 z-50">
      {prices?.xrp && (
        <div className="bg-slate-900 border-b border-slate-800 text-xs md:text-sm text-center py-1.5 px-2 text-slate-300">
          <span className="text-emerald-400 font-medium">XRP</span> ${prices.xrp.usd?.toFixed(4)}
          <span className="text-slate-500 mx-1">·</span>
          <span>₹{prices.xrp.inr?.toFixed(2)}</span>
          <span className={`ml-2 ${isUp ? "text-emerald-400" : "text-red-400"}`}>
            {isUp ? "▲" : "▼"} {Math.abs(xrpChange).toFixed(2)}%
          </span>
          <span className="mx-2 text-slate-600">|</span>
          <span className="text-blue-400 font-medium">XLM</span> ${prices.xlm?.usd?.toFixed(4)}
          <span className="text-slate-500 mx-1">·</span>
          <span>₹{prices.xlm?.inr?.toFixed(2)}</span>
        </div>
      )}

      <nav className="bg-slate-900/95 backdrop-blur border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-red-500 hover:text-red-400">
            GoFood
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <NavLink to="/">Home</NavLink>
            {token && (
              <>
                <NavLink to="/myOrder">Orders</NavLink>
                <NavLink to="/notifications">Alerts</NavLink>
                {isAdmin && (
                  <Link to="/admin" className="px-3 py-1.5 text-sm font-semibold text-red-400 hover:bg-slate-800 rounded-lg">
                    Admin
                  </Link>
                )}
              </>
            )}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <WalletControls
              isLinked={isLinked}
              hasAdapter={hasAdapter}
              abbreviatedAddress={abbreviatedAddress}
              walletType={walletType}
              connecting={connecting}
              onConnect={handleWalletConnect}
              onReconnect={handleReconnect}
              onDisconnect={handleWalletDisconnect}
            />

            {!token ? (
              <>
                <Link to="/login" className="btn-secondary text-sm py-1.5">Login</Link>
                <Link to="/signup" className="btn-primary text-sm py-1.5">Sign up</Link>
              </>
            ) : (
              <>
                <button type="button" onClick={() => setCartView(true)} className="btn-primary text-sm py-1.5 relative">
                  Cart
                  {items.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-white text-red-600 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                      {items.length}
                    </span>
                  )}
                </button>
                <button type="button" onClick={() => { logout(); navigate("/"); }} className="btn-secondary text-sm py-1.5">
                  Logout
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            className="md:hidden text-white p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            ☰
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-slate-800 px-4 py-3 space-y-2 bg-slate-900">
            <NavLink to="/" onClick={() => setMenuOpen(false)}>Home</NavLink>
            {token && <NavLink to="/myOrder" onClick={() => setMenuOpen(false)}>Orders</NavLink>}
            <div className="pt-2">
              <WalletControls
                isLinked={isLinked}
                hasAdapter={hasAdapter}
                abbreviatedAddress={abbreviatedAddress}
                walletType={walletType}
                connecting={connecting}
                onConnect={handleWalletConnect}
                onReconnect={handleReconnect}
                onDisconnect={handleWalletDisconnect}
                stacked
              />
            </div>
            {!token ? (
              <Link to="/login" className="block btn-primary text-center" onClick={() => setMenuOpen(false)}>Login</Link>
            ) : (
              <button type="button" className="w-full btn-primary" onClick={() => { setCartView(true); setMenuOpen(false); }}>
                Cart ({items.length})
              </button>
            )}
          </div>
        )}
      </nav>

      {cartView && (
        <Modal onClose={() => setCartView(false)}>
          <Cart />
        </Modal>
      )}
    </header>
  );
};

function WalletControls({
  isLinked,
  hasAdapter,
  abbreviatedAddress,
  walletType,
  connecting,
  onConnect,
  onReconnect,
  onDisconnect,
  stacked = false,
}) {
  const layout = stacked ? "flex flex-col gap-2" : "flex items-center gap-1.5";

  if (isLinked) {
    return (
      <div className={layout}>
        <span className="btn-secondary text-xs py-1.5 cursor-default inline-flex items-center gap-1.5">
          <span className="text-slate-300">{abbreviatedAddress}</span>
          {walletType && (
            <span className="text-[10px] uppercase tracking-wide text-slate-500">
              {walletType}
            </span>
          )}
        </span>
        {!hasAdapter && (
          <div className={`flex gap-1.5 ${stacked ? "w-full" : ""}`}>
            <WalletAction label="Gem" onClick={() => onReconnect("gem")} disabled={connecting} grow={stacked} />
            <WalletAction label="Freighter" onClick={() => onReconnect("freighter")} disabled={connecting} grow={stacked} />
          </div>
        )}
        <button
          type="button"
          onClick={onDisconnect}
          className={`btn-secondary text-xs py-1.5 text-red-400 hover:text-red-300 ${stacked ? "w-full" : ""}`}
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className={`flex gap-1.5 ${stacked ? "flex-col w-full" : ""}`}>
      <WalletAction label="Gem" onClick={() => onConnect("gem")} disabled={connecting} grow={stacked} />
      <WalletAction label="Freighter" onClick={() => onConnect("freighter")} disabled={connecting} grow={stacked} />
    </div>
  );
}

function WalletAction({ label, onClick, disabled, grow }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`btn-secondary text-xs py-1.5 disabled:opacity-50 ${grow ? "w-full" : ""}`}
    >
      {disabled ? "Connecting…" : label}
    </button>
  );
}

const NavLink = ({ to, children, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className="px-3 py-1.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
  >
    {children}
  </Link>
);

export default Navbar;
