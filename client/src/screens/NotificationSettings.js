import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import ApiClient from "../factories/api/ApiClient";
import { useAuth } from "../contexts/AuthContext";
import TelegramLinkOptions from "../components/TelegramLinkOptions";

const NotificationSettings = () => {
  const { user, fetchMe } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [providers, setProviders] = useState({ telegram: false, discord: false });
  const [prefs, setPrefs] = useState({
    enableTelegram: false,
    enableDiscord: false,
    discordWebhookUrl: "",
  });
  const [message, setMessage] = useState("");
  const [testing, setTesting] = useState(false);

  const notifications = user?.notifications || {};
  const telegramLinked = Boolean(notifications.telegramVerified || notifications.telegramUserId);
  const discordLinked = Boolean(notifications.discordVerified || notifications.discordUserId);

  useEffect(() => {
    if (searchParams.get("linked") === "discord") {
      setMessage("Discord account linked successfully!");
      setSearchParams({}, { replace: true });
      fetchMe();
    }
  }, [searchParams, setSearchParams, fetchMe]);

  useEffect(() => {
    ApiClient.get("/api/auth/providers").then(setProviders).catch(() => {});
  }, []);

  useEffect(() => {
    if (user?.notifications) {
      setPrefs((prev) => ({
        ...prev,
        enableTelegram: user.notifications.enableTelegram ?? false,
        enableDiscord: user.notifications.enableDiscord ?? false,
        discordWebhookUrl: user.notifications.discordWebhookUrl ?? "",
      }));
    }
  }, [user]);

  const handleSave = async () => {
    try {
      await ApiClient.put("/api/user/notifications", prefs);
      await fetchMe();
      setMessage("Settings saved!");
    } catch (e) {
      setMessage(e.message);
    }
  };

  const handleTest = async (channel) => {
    setTesting(true);
    try {
      const res = await ApiClient.post("/api/user/notifications/test", { channel });
      setMessage(res.message || "Test sent!");
    } catch (e) {
      setMessage(e.message);
    } finally {
      setTesting(false);
    }
  };

  const handleDiscordLink = async () => {
    try {
      const { url } = await ApiClient.get("/api/auth/discord/link/start");
      window.location.href = url;
    } catch (e) {
      setMessage(e.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <main className="max-w-lg mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-white mb-1">Alerts &amp; Login</h1>
        <p className="text-slate-400 text-sm mb-8">
          Link Telegram or Discord with one click — no Chat ID to copy.
        </p>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-8">
          {message && (
            <div className="px-4 py-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 text-sm">
              {message}
            </div>
          )}

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white">Telegram</h2>
              {telegramLinked ? (
                <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Linked @{notifications.telegramUsername || notifications.telegramUserId}
                </span>
              ) : (
                <span className="text-xs text-amber-400">Not linked</span>
              )}
            </div>

            {!telegramLinked ? (
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                <TelegramLinkOptions
                  onLinked={(msg) => setMessage(msg)}
                  onError={(err) => setMessage(err)}
                />
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Alerts go to chat ID {notifications.telegramChatId} (saved automatically).
              </p>
            )}

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-slate-600"
                checked={prefs.enableTelegram}
                disabled={!telegramLinked}
                onChange={(e) => setPrefs({ ...prefs, enableTelegram: e.target.checked })}
              />
              <span className="text-sm text-slate-300">Send order alerts via Telegram</span>
            </label>

            {telegramLinked && prefs.enableTelegram && (
              <button
                type="button"
                className="btn-secondary text-sm"
                disabled={testing}
                onClick={() => handleTest("telegram")}
              >
                Test Telegram
              </button>
            )}
          </section>

          <hr className="border-slate-800" />

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white">Discord</h2>
              {discordLinked ? (
                <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Linked {notifications.discordUsername || notifications.discordUserId}
                </span>
              ) : (
                <span className="text-amber-400 text-xs">Not linked</span>
              )}
            </div>

            {!discordLinked && providers.discord && (
              <button
                type="button"
                onClick={handleDiscordLink}
                className="w-full py-2.5 rounded-xl font-medium bg-indigo-600 hover:bg-indigo-500 text-white text-sm"
              >
                Link Discord account (login)
              </button>
            )}

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-slate-600"
                checked={prefs.enableDiscord}
                onChange={(e) => setPrefs({ ...prefs, enableDiscord: e.target.checked })}
              />
              <span className="text-sm text-slate-300">Send alerts to Discord channel webhook</span>
            </label>

            <input
              className="input-field text-sm"
              placeholder="Discord Webhook URL (create in channel settings)"
              value={prefs.discordWebhookUrl}
              onChange={(e) => setPrefs({ ...prefs, discordWebhookUrl: e.target.value })}
            />
            <p className="text-xs text-slate-500">
              Discord login links your account. Webhook URL is only for posting to a server channel.
            </p>

            {prefs.enableDiscord && prefs.discordWebhookUrl && (
              <button
                type="button"
                className="btn-secondary text-sm"
                disabled={testing}
                onClick={() => handleTest("discord")}
              >
                Test Discord Webhook
              </button>
            )}
          </section>

          <button type="button" onClick={handleSave} className="btn-primary w-full py-3">
            Save Settings
          </button>
        </div>
      </main>
    </div>
  );
};

export default NotificationSettings;
