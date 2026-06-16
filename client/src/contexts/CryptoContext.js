import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import API_BASE_URL from "../config";
import PriceFormatter from "../factories/price/PriceFormatter";

const CryptoContext = createContext(null);
const PRICE_POLL_MS = 10 * 60 * 1000;

function normalizePrices(data) {
  if (!data?.xrp?.inr) return null;
  return {
    xrp: data.xrp,
    xlm: data.xlm || data.xrp,
    cachedAt: data.cachedAt,
    nextUpdateAt: data.nextUpdateAt,
    ttlMinutes: data.ttlMinutes ?? 10,
  };
}

export const CryptoProvider = ({ children }) => {
  const [prices, setPrices] = useState(null);
  const [priceMeta, setPriceMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const applyPrices = useCallback((data) => {
    const normalized = normalizePrices(data);
    if (normalized) {
      setPrices({ xrp: normalized.xrp, xlm: normalized.xlm });
      setPriceMeta({
        cachedAt: normalized.cachedAt,
        nextUpdateAt: normalized.nextUpdateAt,
        ttlMinutes: normalized.ttlMinutes,
      });
      setError(null);
      setLoading(false);
    }
  }, []);

  const refreshPrices = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/crypto/prices`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load prices");
      applyPrices(data);
      return normalizePrices(data);
    } catch (e) {
      setError(e.message);
      setLoading(false);
      return null;
    }
  }, [applyPrices]);

  useEffect(() => {
    let eventSource;
    let pollInterval;

    refreshPrices();

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
        /* SSE optional */
      }
    };

    startSSE();
    pollInterval = setInterval(refreshPrices, PRICE_POLL_MS);

    return () => {
      eventSource?.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [applyPrices, refreshPrices]);

  const toXrp = (inr) => (prices?.xrp?.inr ? inr / prices.xrp.inr : 0);
  const toXlm = (inr) => (prices?.xlm?.inr ? inr / prices.xlm.inr : 0);
  const toUsd = (inr) => {
    if (!prices?.xrp?.inr || !prices?.xrp?.usd) return 0;
    const usdPerInr = prices.xrp.usd / prices.xrp.inr;
    return inr * usdPerInr;
  };
  const formatDualPrice = (inr) => PriceFormatter.formatDual(inr, toXrp(inr));

  return (
    <CryptoContext.Provider
      value={{ prices, priceMeta, loading, error, toXrp, toXlm, toUsd, formatDualPrice, refreshPrices }}
    >
      {children}
    </CryptoContext.Provider>
  );
};

export const useCrypto = () => useContext(CryptoContext);
