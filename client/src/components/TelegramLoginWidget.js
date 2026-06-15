import { useEffect, useRef } from "react";

const isLocalDevHost = (hostname) =>
  hostname === "localhost" || hostname === "127.0.0.1" || hostname === "";

/**
 * Telegram Login Widget — requires a public domain set in @BotFather /setdomain.
 * localhost is NOT accepted by Telegram (use ngrok for local dev).
 */
const TelegramLoginWidget = ({ botUsername, onAuth, size = "large", label, loginDomain }) => {
  const containerRef = useRef(null);
  const hostname = typeof window !== "undefined" ? window.location.hostname : "";
  const onLocalhost = isLocalDevHost(hostname);

  useEffect(() => {
    if (!botUsername || !containerRef.current || !onAuth || onLocalhost) return undefined;

    const callbackName = `telegramAuth_${Math.random().toString(36).slice(2)}`;
    window[callbackName] = (user) => {
      onAuth(user);
    };

    const node = containerRef.current;
    node.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", botUsername);
    script.setAttribute("data-size", size);
    script.setAttribute("data-onauth", `${callbackName}(user)`);
    script.setAttribute("data-request-access", "write");
    node.appendChild(script);

    return () => {
      delete window[callbackName];
      node.innerHTML = "";
    };
  }, [botUsername, onAuth, size, onLocalhost]);

  if (!botUsername) {
    return (
      <p className="text-sm text-slate-500">
        Set TELEGRAM_BOT_TOKEN and TELEGRAM_BOT_USERNAME in server .env
      </p>
    );
  }

  if (onLocalhost) {
    return (
      <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-3 text-sm">
        <p className="text-amber-200 font-medium">Telegram login needs a public domain</p>
        <p className="text-slate-400 text-xs leading-relaxed">
          BotFather rejects <code className="text-slate-300">localhost</code>. Use a tunnel for
          local testing, then set that domain in BotFather.
        </p>
        <ol className="text-xs text-slate-400 space-y-2 list-decimal list-inside">
          <li>
            Install ngrok, then run:{" "}
            <code className="text-emerald-400">ngrok http 3001</code>
          </li>
          <li>
            Copy the hostname (e.g.{" "}
            <code className="text-slate-300">abc123.ngrok-free.app</code>)
          </li>
          <li>
            BotFather: <code className="text-slate-300">/setdomain</code> →{" "}
            <code className="text-slate-300">{botUsername}</code> → paste that hostname only
          </li>
          <li>
            Open the app via the ngrok <code className="text-slate-300">https://…</code> URL
          </li>
        </ol>
        {loginDomain && (
          <p className="text-xs text-slate-500">
            Configured domain in .env: <code className="text-slate-300">{loginDomain}</code>
          </p>
        )}
        <p className="text-xs text-slate-500">
          For now: use <strong className="text-slate-300">Gem Wallet</strong> or email login.
          Link Telegram notifications manually with Chat ID under Alerts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && <p className="text-sm text-slate-400">{label}</p>}
      <p className="text-xs text-slate-500">
        Domain for BotFather: <code className="text-emerald-400">{hostname}</code>
      </p>
      <div ref={containerRef} className="flex justify-center min-h-[40px]" />
    </div>
  );
};

export default TelegramLoginWidget;
