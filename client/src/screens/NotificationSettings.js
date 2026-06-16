import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
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
  const [linkEmailForm, setLinkEmailForm] = useState({ email: "", password: "" });
  const [linkingEmail, setLinkingEmail] = useState(false);

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

  const handleLinkEmail = async (e) => {
    e.preventDefault();
    setLinkingEmail(true);
    try {
      const res = await ApiClient.post("/api/auth/link-email", linkEmailForm);
      await fetchMe();
      setLinkEmailForm({ email: "", password: "" });
      setMessage(res.message || "Email linked!");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLinkingEmail(false);
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
    <div className="page-shell">
      <Navbar />
      <main className="page-container-narrow">
        <header className="page-header">
          <h1 className="page-title">Alerts &amp; Login</h1>
          <p className="page-subtitle">
            Link Telegram or Discord with one click — no Chat ID to copy.
          </p>
        </header>

        <div className="section-card-body space-y-8">
          {message && <div className="alert-info">{message}</div>}

          {user?.hasWallet && !user?.hasEmail && (
            <section className="space-y-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
              <h2 className="font-semibold text-white">Add email login</h2>
              <p className="text-sm text-slate-400">
                Connect email and password to the same account as your wallet ({user.walletAddress?.slice(0, 12)}…).
              </p>
              <form onSubmit={handleLinkEmail} className="space-y-3">
                <input
                  className="input-field"
                  type="email"
                  placeholder="Email"
                  value={linkEmailForm.email}
                  onChange={(e) => setLinkEmailForm({ ...linkEmailForm, email: e.target.value })}
                  required
                />
                <input
                  className="input-field"
                  type="password"
                  placeholder="Password (min 6 characters)"
                  minLength={6}
                  value={linkEmailForm.password}
                  onChange={(e) => setLinkEmailForm({ ...linkEmailForm, password: e.target.value })}
                  required
                />
                <button type="submit" className="btn-primary text-sm" disabled={linkingEmail}>
                  {linkingEmail ? "Linking…" : "Link email to this account"}
                </button>
              </form>
            </section>
          )}

          {user?.hasEmail && !user?.hasWallet && (
            <section className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 text-sm text-slate-400">
              Use <strong className="text-slate-200">Connect Wallet</strong> in the navbar to link a wallet to this email account. The same wallet cannot be used on a separate account.
            </section>
          )}

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold text-white">Telegram</h2>
              {telegramLinked ? (
                <span className="badge-emerald">
                  Linked @{notifications.telegramUsername || notifications.telegramUserId}
                </span>
              ) : (
                <span className="badge-amber">Not linked</span>
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
                className="w-4 h-4 rounded border-slate-600 accent-red-500"
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
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold text-white">Discord</h2>
              {discordLinked ? (
                <span className="badge-emerald">
                  Linked {notifications.discordUsername || notifications.discordUserId}
                </span>
              ) : (
                <span className="badge-amber">Not linked</span>
              )}
            </div>

            {!discordLinked && providers.discord && (
              <button
                type="button"
                onClick={handleDiscordLink}
                className="w-full py-2.5 rounded-xl font-medium bg-indigo-600 hover:bg-indigo-500 text-white text-sm transition-colors"
              >
                Link Discord account
              </button>
            )}

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-slate-600 accent-red-500"
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
      <Footer />
    </div>
  );
};

export default NotificationSettings;
