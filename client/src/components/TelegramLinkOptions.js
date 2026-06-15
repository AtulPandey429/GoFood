import { useState, useEffect, useRef } from "react";
import ApiClient from "../factories/api/ApiClient";
import { useAuth } from "../contexts/AuthContext";
import TelegramLoginWidget from "./TelegramLoginWidget";

/**
 * Link Telegram without typing Chat ID:
 * 1. Web widget — user approves in popup (auto-captures chat ID)
 * 2. Open in Telegram app — user taps Start on bot (auto-captures chat ID)
 */
export default function TelegramLinkOptions({ onLinked, onError }) {
  const { fetchMe, updateUser } = useAuth();
  const [providers, setProviders] = useState({ telegram: false });
  const [botLinking, setBotLinking] = useState(false);
  const pollRef = useRef(null);

  useEffect(() => {
    ApiClient.get("/api/auth/providers").then(setProviders).catch(() => {});
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const finishLink = async (message, linkedUser) => {
    if (linkedUser) updateUser(linkedUser);
    await fetchMe();
    onLinked?.(message);
  };

  const handleWidgetLink = async (telegramUser) => {
    try {
      const res = await ApiClient.post("/api/auth/telegram-link", telegramUser);
      await finishLink("Telegram linked! Chat ID saved automatically.", res.user);
    } catch (e) {
      onError?.(e.message);
    }
  };

  const pollBotLink = (pollToken) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await ApiClient.get(`/api/auth/telegram-bot-link/status/${pollToken}`);
        if (res.status === "linked") {
          clearInterval(pollRef.current);
          pollRef.current = null;
          setBotLinking(false);
          await finishLink("Telegram linked via app! You'll get alerts here.", res.user);
        } else if (res.status === "expired") {
          clearInterval(pollRef.current);
          pollRef.current = null;
          setBotLinking(false);
          onError?.("Link expired — try again");
        }
      } catch {
        /* keep polling */
      }
    }, 2000);
  };

  const handleBotAppLink = async () => {
    setBotLinking(true);
    try {
      const { botUrl, pollToken } = await ApiClient.post("/api/auth/telegram-bot-link/start", {});
      window.open(botUrl, "_blank", "noopener,noreferrer");
      pollBotLink(pollToken);
    } catch (e) {
      setBotLinking(false);
      onError?.(e.message);
    }
  };

  if (!providers.telegram) {
    return (
      <p className="text-xs text-slate-500">Telegram bot not configured on server.</p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-400">
        No Chat ID needed — link with permission and we save it automatically.
      </p>

      <TelegramLoginWidget
        botUsername={providers.telegramBotUsername}
        loginDomain={providers.telegramLoginDomain}
        size="medium"
        label="Option 1: Link on this page"
        onAuth={handleWidgetLink}
      />

      <div className="text-center text-xs text-slate-600">or</div>

      <button
        type="button"
        onClick={handleBotAppLink}
        disabled={botLinking}
        className="w-full py-2.5 rounded-xl text-sm font-medium bg-sky-600 hover:bg-sky-500 text-white disabled:opacity-60"
      >
        {botLinking ? "Waiting for you in Telegram…" : "Option 2: Open in Telegram app"}
      </button>
      {botLinking && (
        <p className="text-xs text-slate-500 text-center">
          Tap <strong>Start</strong> in the bot chat, then return here.
        </p>
      )}
    </div>
  );
}
