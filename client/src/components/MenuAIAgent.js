import React, { useState, useEffect, useRef } from "react";
import ApiClient from "../factories/api/ApiClient";

const EXAMPLE_PROMPTS = [
  "Add Margherita pizza at ₹299 in Pizza category",
  "New cold coffee drink for ₹99",
  "Create double cheese burger 249 rupees",
];

const PROVIDER_LABELS = {
  gemini: "Gemini",
  groq: "Groq",
  openrouter: "OpenRouter",
  cerebras: "Cerebras",
  openai: "OpenAI",
};

const MenuAIAgent = ({ onApplySuggestion, onItemCreated }) => {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Describe a dish and AI will draft it. Tries Gemini → Groq → OpenRouter → Cerebras → OpenAI (whichever keys you have).",
    },
  ]);
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [agentStatus, setAgentStatus] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    ApiClient.get("/api/admin/menu-agent/status")
      .then(setAgentStatus)
      .catch(() => setAgentStatus({ configured: false }));
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, suggestion]);

  const runSuggest = async (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setLoading(true);
    setSuggestion(null);
    setMessages((m) => [...m, { role: "user", text: trimmed }]);
    setPrompt("");

    try {
      const res = await ApiClient.post("/api/admin/menu-agent/suggest", { prompt: trimmed });
      setSuggestion(res.item);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: res.reply || "Here's what I suggest:",
          meta: res.source,
          note: res.note,
        },
      ]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", text: e.message, error: true }]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!suggestion) return;
    setLoading(true);
    try {
      await ApiClient.post("/api/admin/menu-agent/create", { item: suggestion });
      setMessages((m) => [
        ...m,
        { role: "assistant", text: `Added "${suggestion.name}" to the menu at ₹${suggestion.price}.` },
      ]);
      setSuggestion(null);
      onItemCreated?.();
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", text: e.message, error: true }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section-card flex flex-col h-full min-h-[320px]">
      <div className="section-card-header border-b border-slate-800">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="text-red-400">✦</span> Menu AI
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {agentStatus?.configured ? (
                <>
                  {agentStatus.activeProviders?.map((id, i) => (
                    <span key={id}>
                      {i > 0 && <span className="text-slate-600 mx-1">→</span>}
                      <span className="text-emerald-400/90">{PROVIDER_LABELS[id] || id}</span>
                    </span>
                  ))}
                  <span className="text-slate-600 ml-1">· auto-failover</span>
                </>
              ) : (
                "Add GEMINI, GROQ, OPENROUTER, or CEREBRAS API key in .env"
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 max-h-52 text-sm">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`rounded-xl px-3 py-2 ${
              msg.role === "user"
                ? "bg-red-500/15 border border-red-500/20 text-slate-200 ml-4"
                : msg.error
                  ? "bg-red-950/40 border border-red-800 text-red-300"
                  : "bg-slate-800/60 border border-slate-700 text-slate-300 mr-4"
            }`}
          >
            {msg.text}
            {msg.meta && (
              <p className="text-[10px] text-slate-500 mt-1 capitalize">via {msg.meta}</p>
            )}
            {msg.note && <p className="text-[10px] text-amber-500/80 mt-1">{msg.note}</p>}
          </div>
        ))}
        {loading && (
          <p className="text-xs text-slate-500 animate-pulse px-2">Thinking…</p>
        )}
        <div ref={chatEndRef} />
      </div>

      {suggestion && (
        <div className="mx-4 mb-3 p-3 rounded-xl bg-slate-800/80 border border-slate-600 space-y-2">
          <p className="text-xs text-slate-400 uppercase tracking-wide">Preview</p>
          {suggestion.img && (
            <img
              src={suggestion.img}
              alt={suggestion.name}
              className="w-full h-28 object-cover rounded-lg bg-slate-900"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          )}
          <p className="text-white font-medium">{suggestion.name}</p>
          <p className="text-xs text-slate-400">
            {suggestion.CategoryName} · <span className="text-red-400">₹{suggestion.price}</span>
          </p>
          {suggestion.description && (
            <p className="text-xs text-slate-500 line-clamp-2">{suggestion.description}</p>
          )}
          {Array.isArray(suggestion.imageReferences) && suggestion.imageReferences.length > 0 && (
            <div className="space-y-1">
              <p className="text-[11px] text-slate-400">AI image references (pick from platform)</p>
              <div className="space-y-1">
                {suggestion.imageReferences.map((ref, idx) => (
                  <div key={`${ref.searchUrl}-${idx}`} className="text-[11px] text-slate-300">
                    <a
                      href={ref.searchUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-400 hover:text-sky-300 underline"
                    >
                      {ref.platform}
                    </a>
                    <span className="text-slate-500"> · {ref.searchQuery}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={handleCreate}
              disabled={loading}
              className="btn-primary text-xs py-1 px-2.5"
            >
              Add to menu
            </button>
            <button
              type="button"
              onClick={() => onApplySuggestion?.(suggestion)}
              disabled={loading}
              className="btn-secondary text-xs py-1 px-2.5"
            >
              Edit first
            </button>
          </div>
        </div>
      )}

      <div className="p-4 border-t border-slate-800 space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLE_PROMPTS.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => runSuggest(ex)}
              disabled={loading}
              className="text-[10px] px-2 py-0.5 rounded-full border border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600"
            >
              {ex.slice(0, 28)}…
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            runSuggest(prompt);
          }}
          className="flex gap-2"
        >
          <input
            className="input-field text-sm flex-1"
            placeholder='e.g. "Add veg supreme pizza at 449"'
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
          />
          <button type="submit" disabled={loading || !prompt.trim() || !agentStatus?.configured} className="btn-primary text-sm px-3 shrink-0">
            Send
          </button>
        </form>
      </div>
    </section>
  );
};

export default MenuAIAgent;
