import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-slate-900 border-t border-slate-800 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h4 className="text-lg font-semibold text-white mb-3">About GoFood</h4>
          <p className="text-slate-400 text-sm leading-relaxed">
            GoFood delivers delicious meals to your door. Browse local favorites and
            international dishes, pay with cash or crypto.
          </p>
        </div>
        <div>
          <h4 className="text-lg font-semibold text-white mb-3">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/" className="text-slate-400 hover:text-red-400 transition-colors">
                Home
              </Link>
            </li>
            <li>
              <Link to="/login" className="text-slate-400 hover:text-red-400 transition-colors">
                Login
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-lg font-semibold text-white mb-3">Contact</h4>
          <p className="text-slate-400 text-sm">
            Email: contact@gofood.app
            <br />
            Phone: +91 98765 43210
          </p>
        </div>
      </div>

      <div className="border-t border-slate-800 py-6 relative">
        <p className="text-center text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} GoFood. All rights reserved.
        </p>
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-full shadow-lg shadow-emerald-500/30 transition-colors z-40"
        >
          Back to Top
        </button>
      </div>
    </footer>
  );
};

export default Footer;
