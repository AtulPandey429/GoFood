import { Link } from "react-router-dom";
import ApiClient from "../factories/api/ApiClient";
import { useAuth } from "../contexts/AuthContext";
import TelegramLinkOptions from "./TelegramLinkOptions";

/** Compact Telegram / Discord link panel for cart & checkout */
export default function AccountAlertsPanel({ onMessage }) {
  const { user, fetchMe } = useAuth();
  const n = user?.notifications || {};
  const telegramLinked = Boolean(n.telegramVerified || n.telegramUserId);
  const discordLinked = Boolean(n.discordVerified || n.discordUserId);

  const handleDiscordLink = async () => {
    try {
      const { url } = await ApiClient.get("/api/auth/discord/link/start");
      window.location.href = url;
    } catch (e) {
      onMessage?.(e.message);
    }
  };

  if (!user) return null;

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-white">Order alerts &amp; login</p>
        <Link to="/notifications" className="text-xs text-red-400 hover:text-red-300">
          Manage →
        </Link>
      </div>

      <div className="space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Telegram</span>
          {telegramLinked ? (
            <span className="text-emerald-400">Linked @{n.telegramUsername || n.telegramUserId}</span>
          ) : (
            <span className="text-amber-400">Not linked</span>
          )}
        </div>

        {!telegramLinked && (
          <TelegramLinkOptions
            onLinked={(msg) => {
              fetchMe();
              onMessage?.(msg);
            }}
            onError={onMessage}
          />
        )}

        <div className="flex items-center justify-between pt-1 border-t border-slate-700/50">
          <span className="text-slate-400">Discord</span>
          {discordLinked ? (
            <span className="text-emerald-400">Linked {n.discordUsername || n.discordUserId}</span>
          ) : (
            <span className="text-amber-400">Not linked</span>
          )}
        </div>

        {!discordLinked && (
          <button
            type="button"
            onClick={handleDiscordLink}
            className="w-full py-2 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            Link Discord (OAuth)
          </button>
        )}
      </div>
    </div>
  );
}
