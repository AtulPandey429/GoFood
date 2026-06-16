import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import WalletFactory from "../factories/wallet/WalletFactory";
import ApiClient from "../factories/api/ApiClient";
import { useAuth } from "./AuthContext";
import PriceFormatter from "../factories/price/PriceFormatter";
import WalletConnectModal from "../components/WalletConnectModal";
import {
  readWalletSession,
  saveWalletSession,
  clearWalletSession,
} from "../utils/walletSession";

const WalletContext = createContext(null);

async function attachAdapter(walletType) {
  const adapter = WalletFactory.create(walletType);
  const connected = await adapter.connect();
  return {
    address: connected.address,
    walletType: connected.walletType || walletType,
    publicKey: connected.publicKey,
    adapter,
  };
}

export const WalletProvider = ({ children }) => {
  const { login, logout, user, updateUser } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [connectingType, setConnectingType] = useState(null);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const restoreStarted = useRef(false);

  const openWalletModal = useCallback(() => {
    setError(null);
    setModalOpen(true);
  }, []);

  const closeWalletModal = useCallback(() => {
    if (!connecting) setModalOpen(false);
  }, [connecting]);

  const applyWallet = useCallback((next) => {
    setWallet(next);
    if (next?.address && next?.walletType) {
      saveWalletSession({
        walletType: next.walletType,
        address: next.address,
        publicKey: next.publicKey,
      });
    }
  }, []);

  // Restore extension session on load (xMagnetic-style — connect once, reuse everywhere)
  useEffect(() => {
    if (restoreStarted.current) return;
    restoreStarted.current = true;

    let cancelled = false;
    (async () => {
      const saved = readWalletSession();
      const type = saved?.walletType || user?.walletType;
      if (!type) {
        setRestoring(false);
        return;
      }
      try {
        const next = await attachAdapter(type);
        if (cancelled) return;
        applyWallet(next);
      } catch {
        if (!cancelled) clearWalletSession();
      } finally {
        if (!cancelled) setRestoring(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.walletType, applyWallet]);

  // Sync profile hint when logged in but session not yet restored
  useEffect(() => {
    if (wallet?.adapter || !user?.walletAddress) return;
    setWallet((prev) => {
      if (prev?.adapter) return prev;
      return {
        address: user.walletAddress,
        walletType: user.walletType,
        publicKey: prev?.publicKey,
        adapter: null,
      };
    });
  }, [user, wallet?.adapter]);

  const connectWallet = useCallback(
    async (type, { withLogin = true } = {}) => {
      if (!["gem", "freighter"].includes(type)) {
        throw new Error("Unsupported wallet");
      }
      setConnecting(true);
      setConnectingType(type);
      setError(null);
      try {
        const next = await attachAdapter(type);
        applyWallet(next);

        if (withLogin) {
          if (user?.hasEmail && !user?.hasWallet) {
            const challenge = await ApiClient.get("/api/auth/wallet-challenge");
            const signature = await next.adapter.signMessage(challenge.nonce);
            const result = await ApiClient.post("/api/auth/link-wallet", {
              walletAddress: next.address,
              walletType: next.walletType,
              signature,
              nonce: challenge.nonce,
              publicKey: next.publicKey || undefined,
            });
            updateUser(result.user);
          } else if (!user?.id) {
            const challenge = await ApiClient.get("/api/auth/wallet-challenge");
            const signature = await next.adapter.signMessage(challenge.nonce);
            const result = await ApiClient.post("/api/auth/wallet-login", {
              walletAddress: next.address,
              walletType: next.walletType,
              signature,
              nonce: challenge.nonce,
              publicKey: next.publicKey || undefined,
            });
            login(result.authToken, result.user);
          } else if (user?.hasWallet && user.walletAddress !== next.address) {
            throw new Error("This wallet does not match your linked account");
          }
        }

        setModalOpen(false);
        return next;
      } catch (e) {
        setError(e.message || "Could not connect wallet");
        throw e;
      } finally {
        setConnecting(false);
        setConnectingType(null);
      }
    },
    [applyWallet, login, updateUser, user]
  );

  const ensureConnected = useCallback(async () => {
    if (wallet?.adapter) return wallet;
    const saved = readWalletSession();
    if (saved?.walletType) {
      const next = await attachAdapter(saved.walletType);
      applyWallet(next);
      return next;
    }
    openWalletModal();
    throw new Error("Connect your wallet to continue");
  }, [wallet, applyWallet, openWalletModal]);

  const pay = useCallback(
    async ({ amount, asset, to, walletOverride }) => {
      const active = walletOverride || wallet;
      if (!active?.adapter) {
        const connected = await ensureConnected();
        return connected.adapter.sendPayment({ amount, asset, to });
      }
      return active.adapter.sendPayment({ amount, asset, to });
    },
    [wallet, ensureConnected]
  );

  const disconnect = useCallback(() => {
    clearWalletSession();
    setWallet(null);
    setError(null);
    setModalOpen(false);
    if (user?.walletAddress) logout();
  }, [logout, user?.walletAddress]);

  const abbreviatedAddress = PriceFormatter.abbreviateAddress(wallet?.address);
  const walletType = wallet?.walletType;
  const isConnected = Boolean(wallet?.adapter);
  const isLinked = isConnected;

  return (
    <WalletContext.Provider
      value={{
        wallet,
        connecting,
        connectingType,
        restoring,
        error,
        modalOpen,
        openWalletModal,
        closeWalletModal,
        connectWallet,
        connect: connectWallet,
        ensureConnected,
        disconnect,
        pay,
        abbreviatedAddress,
        walletType,
        isConnected,
        isLinked,
        hasAdapter: isConnected,
      }}
    >
      {children}
      <WalletConnectModal />
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
