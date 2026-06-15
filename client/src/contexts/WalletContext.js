import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import WalletFactory from "../factories/wallet/WalletFactory";
import ApiClient from "../factories/api/ApiClient";
import { useAuth } from "./AuthContext";
import PriceFormatter from "../factories/price/PriceFormatter";

const WalletContext = createContext(null);

export const WalletProvider = ({ children }) => {
  const { login, user } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  // Show linked wallet from auth profile (adapter attached on connect / payment)
  useEffect(() => {
    if (user?.walletAddress) {
      setWallet((prev) => {
        if (prev?.adapter) return prev;
        return {
          address: user.walletAddress,
          walletType: user.walletType,
          publicKey: prev?.publicKey,
          adapter: null,
        };
      });
    } else if (!user) {
      setWallet(null);
    }
  }, [user]);

  const connectForPayment = useCallback(async (type) => {
    const walletType = type || wallet?.walletType || user?.walletType || "gem";
    setConnecting(true);
    setError(null);
    try {
      const adapter = WalletFactory.create(walletType);
      const connected = await adapter.connect();
      const next = {
        address: connected.address,
        walletType: connected.walletType || walletType,
        publicKey: connected.publicKey,
        adapter,
      };
      setWallet(next);
      return next;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setConnecting(false);
    }
  }, [wallet?.walletType, user?.walletType]);

  const connect = useCallback(
    async (type = "sandbox") => {
      setConnecting(true);
      setError(null);
      try {
        const adapter = WalletFactory.create(type);
        const connected = await adapter.connect();
        const { address, walletType, publicKey } = connected;
        setWallet({ address, walletType, publicKey, adapter });

        const challenge = await ApiClient.get("/api/auth/wallet-challenge");
        const signature = await adapter.signMessage(challenge.nonce);
        const result = await ApiClient.post("/api/auth/wallet-login", {
          walletAddress: address,
          walletType: type === "sandbox" ? "sandbox" : walletType,
          signature,
          nonce: challenge.nonce,
          publicKey: publicKey || undefined,
        });
        login(result.authToken, result.user);
        return { address, walletType };
      } catch (e) {
        setError(e.message);
        throw e;
      } finally {
        setConnecting(false);
      }
    },
    [login]
  );

  const pay = useCallback(
    async ({ amount, asset, to, walletOverride }) => {
      const active = walletOverride || wallet;
      if (!active?.adapter) {
        throw new Error("Wallet not connected — approve the extension popup to pay");
      }
      return active.adapter.sendPayment({ amount, asset, to });
    },
    [wallet]
  );

  const disconnect = useCallback(() => {
    setWallet(null);
    setError(null);
  }, []);

  const abbreviatedAddress = PriceFormatter.abbreviateAddress(
    wallet?.address || user?.walletAddress
  );

  const walletType = wallet?.walletType || user?.walletType;
  const isLinked = Boolean(wallet?.address || user?.walletAddress);
  const hasAdapter = Boolean(wallet?.adapter);

  return (
    <WalletContext.Provider
      value={{
        wallet,
        connecting,
        error,
        connect,
        connectForPayment,
        disconnect,
        pay,
        abbreviatedAddress,
        walletType,
        isLinked,
        hasAdapter,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return ctx;
};
