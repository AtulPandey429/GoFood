/** Empty in dev — Vite proxies /api to Express. Set VITE_API_URL in production. */
const API_BASE_URL = import.meta.env.VITE_API_URL || "";

export default API_BASE_URL;
