/**
 * Smoke test — run: npm run test:api
 * Requires backend on PORT from .env (default 3010) and optional CRA proxy on 3000.
 */
require("../Config/env");

const PORT = process.env.PORT || 3010;
const API = `http://localhost:${PORT}`;
const PROXY = "http://localhost:3000";

async function run(name, fn) {
  try {
    await fn();
    console.log(`  OK  ${name}`);
    return true;
  } catch (e) {
    console.log(`  FAIL ${name}: ${e.message}`);
    return false;
  }
}

(async () => {
  console.log(`\nGoFood API smoke test (backend ${API})\n`);
  let passed = 0;
  let total = 0;

  const check = async (name, fn) => {
    total++;
    if (await run(name, fn)) passed++;
  };

  await check("GET /api/health", async () => {
    const r = await fetch(`${API}/api/health`);
    const j = await r.json();
    if (!j.success) throw new Error(JSON.stringify(j));
  });

  await check("POST /api/display/fooditems", async () => {
    const r = await fetch(`${API}/api/display/fooditems`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    const j = await r.json();
    if (!j[0]?.length) throw new Error("empty menu");
  });

  await check("Proxy fooditems @3000 → 3010", async () => {
    const r = await fetch(`${PROXY}/api/display/fooditems`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    if (!r.ok) throw new Error(`status ${r.status} — is CRA dev server running?`);
  });

  await check("Auth + order flow", async () => {
    const email = `smoke${Date.now()}@test.com`;
    await fetch(`${API}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Smoke",
        email,
        password: "test123",
        location: "Delhi",
      }),
    });
    const loginRes = await fetch(`${API}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "test123" }),
    });
    const login = await loginRes.json();
    if (!login.authToken) throw new Error("login failed");
    const orderRes = await fetch(`${API}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${login.authToken}`,
      },
      body: JSON.stringify({
        order_data: [{ name: "Test", price: 50, qty: 1 }],
        paymentMethod: "Cash",
      }),
    });
    const order = await orderRes.json();
    if (!order.success || !order.orderId) throw new Error(JSON.stringify(order));
  });

  await check("GET /api/crypto/prices", async () => {
    const r = await fetch(`${API}/api/crypto/prices`);
    const j = await r.json();
    if (!j.xrp?.usd) throw new Error("missing price data");
  });

  console.log(`\n${passed}/${total} passed\n`);
  process.exit(passed === total ? 0 : 1);
})();
