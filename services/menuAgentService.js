const env = require("../Config/env");
const { pickMenuImage } = require("../utils/menuImagePool");
const { isImageUrlReachable } = require("../utils/validateImageUrl");

const CATEGORIES = ["Pizza", "Burger", "Dessert", "Drinks"];

const SYSTEM_PROMPT = `You are GoFood's menu assistant for an Indian food delivery app.
The admin describes a dish in plain language. Reply with JSON only:
{
  "name": "string",
  "CategoryName": one of Pizza|Burger|Dessert|Drinks,
  "price": number in INR,
  "description": "short appetizing description",
  "img": "optional — omit unless you are certain the Unsplash URL exists; server assigns a verified image",
  "reply": "one line: ready to review this draft (do NOT say it is already saved or added)"
}
Prices are in Indian Rupees. Do not invent Unsplash photo IDs — leave img empty if unsure.`;

const PROVIDER_IDS = ["gemini", "groq", "openrouter", "cerebras", "openai"];
const DEFAULT_PROVIDER_ORDER = "gemini,groq,openrouter,cerebras,openai";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const GEMINI_DEFAULT_MODEL = "gemini-2.5-flash";
const GEMINI_MODEL_FALLBACKS = ["gemini-2.0-flash", "gemini-flash-latest"];

let resolvedGeminiModel = null;

function geminiModelCandidates() {
  const preferred = env.GEMINI_MODEL || GEMINI_DEFAULT_MODEL;
  return [preferred, GEMINI_DEFAULT_MODEL, ...GEMINI_MODEL_FALLBACKS].filter(
    (m, i, a) => m && a.indexOf(m) === i
  );
}

function getGeminiModel() {
  return resolvedGeminiModel || env.GEMINI_MODEL || GEMINI_DEFAULT_MODEL;
}

function buildUserMessage(prompt, menuContext) {
  const usedImages = menuContext.usedImages || [];
  const usedSample = usedImages.slice(0, 12).join("\n  - ") || "none";
  return `Current menu categories: ${menuContext.categories.join(", ")}.
Existing items: ${menuContext.itemNames.slice(0, 20).join(", ") || "none"}.
Image URLs already on the menu (do not reuse):
  - ${usedSample}

Admin request: ${prompt}`;
}

function defaultOptions(price) {
  const base = Number(price) || 0;
  return [
    { label: "Full", price: base },
    { label: "Half", price: Math.round(base * 0.55) },
  ];
}

function normalizeItem(raw) {
  const name = String(raw.name || "").trim();
  if (!name) throw new Error("Could not determine item name from prompt");

  let category = String(raw.CategoryName || raw.category || "Pizza").trim();
  const matchCat = CATEGORIES.find((c) => c.toLowerCase() === category.toLowerCase());
  category = matchCat || CATEGORIES[0];

  const price = Math.round(Number(raw.price) || 0);
  if (price <= 0) throw new Error("Could not determine a valid price (INR)");

  const description = String(raw.description || `${name} — freshly prepared`).trim();

  return {
    name,
    CategoryName: category,
    price,
    description,
    options: raw.options?.length ? raw.options : defaultOptions(price),
    reply: raw.reply || `Ready to review ${name} at ₹${price}.`,
    proposedImg: String(raw.img || "").trim(),
  };
}

async function attachMenuImage(item, menuContext) {
  const used = new Set((menuContext.usedImages || []).filter(Boolean));
  const proposed = item.proposedImg || "";

  let img = "";
  let imageNote;

  if (proposed && !used.has(proposed) && (await isImageUrlReachable(proposed))) {
    img = proposed;
  } else {
    if (proposed) {
      imageNote = "Suggested image URL was broken or already used — assigned a verified photo.";
    }
    img = pickMenuImage(item.CategoryName, used);
  }

  const { proposedImg, ...rest } = item;
  return { ...rest, img, imageNote };
}

function parseJsonContent(text) {
  const trimmed = String(text).trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(raw);
}

function isFailoverError(status, message) {
  if ([429, 500, 502, 503, 529].includes(status)) return true;
  const msg = String(message || "").toLowerCase();
  return /rate.?limit|quota|exhausted|overloaded|capacity|too many requests|resource_exhausted|high demand|temporarily unavailable|service unavailable/.test(
    msg
  );
}

function isModelNotFoundError(status, message) {
  if (status === 404) return true;
  const msg = String(message || "").toLowerCase();
  return /not found|is not supported for generatecontent|does not exist|unknown model/.test(msg);
}

function isGeminiModelRetryable(status, message) {
  return isModelNotFoundError(status, message) || isFailoverError(status, message);
}

function getProviderOrder() {
  const raw = env.MENU_AI_PROVIDER_ORDER || DEFAULT_PROVIDER_ORDER;
  const allowed = new Set(PROVIDER_IDS);
  return raw
    .split(",")
    .map((p) => p.trim().toLowerCase())
    .filter((p) => allowed.has(p));
}

function providerAvailability() {
  return {
    gemini: {
      enabled: Boolean(env.GEMINI_API_KEY),
      model: getGeminiModel(),
      configuredModel: env.GEMINI_MODEL || GEMINI_DEFAULT_MODEL,
      fallbackModels: geminiModelCandidates(),
      signup: "https://aistudio.google.com/apikey",
    },
    groq: {
      enabled: Boolean(env.GROQ_API_KEY),
      model: env.GROQ_MODEL || "llama-3.3-70b-versatile",
      signup: "https://console.groq.com/keys",
    },
    openrouter: {
      enabled: Boolean(env.OPENROUTER_API_KEY),
      model: env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free",
      signup: "https://openrouter.ai/keys",
    },
    cerebras: {
      enabled: Boolean(env.CEREBRAS_API_KEY),
      model: env.CEREBRAS_MODEL || "llama3.1-8b",
      signup: "https://cloud.cerebras.ai/",
    },
    openai: {
      enabled: Boolean(env.OPENAI_API_KEY),
      model: env.OPENAI_MODEL || "gpt-4o-mini",
      signup: "https://platform.openai.com/api-keys",
    },
  };
}

async function callChatCompletions({
  provider,
  baseUrl,
  apiKey,
  model,
  prompt,
  menuContext,
  extraHeaders = {},
}) {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...extraHeaders,
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserMessage(prompt, menuContext) },
      ],
    }),
  });

  const errBody = await res.text();
  if (!res.ok) {
    let errMsg = errBody.slice(0, 200);
    try {
      const parsed = JSON.parse(errBody);
      errMsg = parsed?.error?.message || parsed?.message || errMsg;
    } catch {
      // keep raw slice
    }
    const err = new Error(`${provider} error: ${res.status} ${errMsg}`);
    err.status = res.status;
    err.failover = isFailoverError(res.status, errMsg) || isModelNotFoundError(res.status, errMsg);
    throw err;
  }

  let data;
  try {
    data = JSON.parse(errBody);
  } catch {
    throw new Error(`Empty ${provider} response`);
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error(`Empty ${provider} response`);
  return parseJsonContent(content);
}

async function callOpenAI(prompt, menuContext) {
  return callChatCompletions({
    provider: "openai",
    baseUrl: "https://api.openai.com/v1",
    apiKey: env.OPENAI_API_KEY,
    model: env.OPENAI_MODEL || "gpt-4o-mini",
    prompt,
    menuContext,
  });
}

async function callGroq(prompt, menuContext) {
  return callChatCompletions({
    provider: "groq",
    baseUrl: "https://api.groq.com/openai/v1",
    apiKey: env.GROQ_API_KEY,
    model: env.GROQ_MODEL || "llama-3.3-70b-versatile",
    prompt,
    menuContext,
  });
}

async function callOpenRouter(prompt, menuContext) {
  return callChatCompletions({
    provider: "openrouter",
    baseUrl: "https://openrouter.ai/api/v1",
    apiKey: env.OPENROUTER_API_KEY,
    model: env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free",
    prompt,
    menuContext,
    extraHeaders: {
      "HTTP-Referer": env.CLIENT_URL || "http://localhost:3001",
      "X-Title": "GoFood Menu AI",
    },
  });
}

async function callCerebras(prompt, menuContext) {
  return callChatCompletions({
    provider: "cerebras",
    baseUrl: "https://api.cerebras.ai/v1",
    apiKey: env.CEREBRAS_API_KEY,
    model: env.CEREBRAS_MODEL || "llama3.1-8b",
    prompt,
    menuContext,
  });
}

async function callGeminiWithModel(model, prompt, menuContext) {
  const url = `${GEMINI_API_BASE}/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: `${SYSTEM_PROMPT}\n\n${buildUserMessage(prompt, menuContext)}` }],
        },
      ],
      generationConfig: {
        temperature: 0.4,
        responseMimeType: "application/json",
      },
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    const errMsg = data?.error?.message || JSON.stringify(data).slice(0, 160);
    const err = new Error(`gemini error: ${res.status} ${errMsg}`);
    err.status = res.status;
    err.failover = isGeminiModelRetryable(res.status, errMsg);
    throw err;
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    const block = data.candidates?.[0]?.finishReason || "unknown";
    throw new Error(`Empty gemini response (${block})`);
  }
  return parseJsonContent(text);
}

async function callGemini(prompt, menuContext) {
  const candidates = geminiModelCandidates();
  const modelErrors = [];

  for (const model of candidates) {
    try {
      const parsed = await callGeminiWithModel(model, prompt, menuContext);
      if (model !== candidates[0]) {
        console.warn(`[menu-agent] gemini fallback model in use: ${model}`);
      }
      resolvedGeminiModel = model;
      return parsed;
    } catch (e) {
      if (!isGeminiModelRetryable(e.status, e.message)) throw e;
      modelErrors.push(`${model}: ${e.message}`);
    }
  }

  const err = new Error(`gemini error: all models busy or unavailable. ${modelErrors.join(" | ")}`);
  err.failover = true;
  throw err;
}

const CALLERS = {
  gemini: callGemini,
  groq: callGroq,
  openrouter: callOpenRouter,
  cerebras: callCerebras,
  openai: callOpenAI,
};

const menuAgentService = {
  isConfigured() {
    const avail = providerAvailability();
    return PROVIDER_IDS.some((id) => avail[id]?.enabled);
  },

  getStatus() {
    const providers = providerAvailability();
    const order = getProviderOrder().filter((name) => providers[name]?.enabled);
    return {
      configured: order.length > 0,
      providerOrder: getProviderOrder(),
      activeProviders: order,
      providers,
      failover: true,
    };
  },

  async suggestFromPrompt(prompt, menuContext = {}) {
    const context = {
      categories: menuContext.categories?.length ? menuContext.categories : CATEGORIES,
      itemNames: menuContext.itemNames || [],
      usedImages: menuContext.usedImages || [],
    };

    if (!prompt?.trim()) {
      throw new Error("Prompt is required");
    }

    const trimmed = prompt.trim();
    const providers = providerAvailability();
    const order = getProviderOrder().filter((name) => providers[name]?.enabled);

    if (order.length === 0) {
      throw new Error(
        "Add at least one API key: GEMINI_API_KEY, GROQ_API_KEY, OPENROUTER_API_KEY, CEREBRAS_API_KEY, or OPENAI_API_KEY"
      );
    }

    const errors = [];

    for (let i = 0; i < order.length; i += 1) {
      const name = order[i];
      const hasFallback = i < order.length - 1;

      try {
        const parsed = await CALLERS[name](trimmed, context);
        let item;
        try {
          item = normalizeItem(parsed);
          item = await attachMenuImage(item, context);
        } catch (normErr) {
          normErr.failover = false;
          throw normErr;
        }

        const noteParts = [];
        if (errors.length > 0) {
          noteParts.push(
            `Used ${name} (${errors[errors.length - 1].provider} failed — auto-switched)`
          );
        }
        if (item.imageNote) noteParts.push(item.imageNote);
        const { imageNote, ...itemOut } = item;
        const note = noteParts.length ? noteParts.join(" ") : undefined;

        return { item: itemOut, reply: itemOut.reply, source: name, note };
      } catch (e) {
        console.warn(`[menu-agent] ${name} failed:`, e.message);
        errors.push({ provider: name, message: e.message });

        if (!hasFallback || e.failover === false) break;
      }
    }

    const detail = errors.map((e) => `${e.provider}: ${e.message}`).join(" | ");
    throw new Error(`All AI providers failed. ${detail}`);
  },
};

module.exports = menuAgentService;
