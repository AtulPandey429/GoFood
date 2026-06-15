import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import API_BASE_URL from "../config";
import PriceFormatter from "../factories/price/PriceFormatter";

const CryptoContext = createContext(null);

function normalizePrices(data) {
  if (!data?.xrp?.inr) return null;
  return { xrp: data.xrp, xlm: data.xlm || data.xrp };
}

export const CryptoProvider = ({ children }) => {
  const [prices, setPrices] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const applyPrices = useCallback((data) => {
    const normalized = normalizePrices(data);
    if (normalized) {
      setPrices(normalized);
      setError(null);
      setLoading(false);
    }
  }, []);

  const refreshPrices = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/crypto/prices`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load prices");
      const normalized = normalizePrices(data);
      if (!normalized) throw new Error("Price data unavailable");
      setPrices(normalized);
      setError(null);
      setLoading(false);
      return normalized;
    } catch (e) {
      setError(e.message);
      setLoading(false);
      return null;
    }
  }, []);

  useEffect(() => {
    let eventSource;
    let pollInterval;

    refreshPrices();

    pollInterval = setInterval(refreshPrices, 30000);

    const startSSE = () => {
      try {
        const url = `${API_BASE_URL}/api/events/prices`;
        eventSource = new EventSource(url);
        eventSource.addEventListener("prices", (e) => {
          try {
            applyPrices(JSON.parse(e.data));
          } catch {
            /* ignore */
          }
        });
        eventSource.onerror = () => {
          eventSource?.close();
          eventSource = null;
        };
      } catch {
        /* SSE optional — polling handles ngrok */
      }
    };

    startSSE();

    return () => {
      eventSource?.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [applyPrices, refreshPrices]);

  const toXrp = (inr) => (prices?.xrp?.inr ? inr / prices.xrp.inr : 0);
  const toXlm = (inr) => (prices?.xlm?.inr ? inr / prices.xlm.inr : 0);
  const formatDualPrice = (inr) => PriceFormatter.formatDual(inr, toXrp(inr));

  return (
    <CryptoContext.Provider
      value={{ prices, loading, error, toXrp, toXlm, formatDualPrice, refreshPrices }}
    >
      {children}
    </CryptoContext.Provider>
  );
};

export const useCrypto = () => useContext(CryptoContext);
