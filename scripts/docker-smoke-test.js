/**
 * Docker deployment smoke test.
 * Run: docker compose --profile test run --rm test
 * Env: API_URL (default http://backend:3000), FRONTEND_URL (default http://frontend)
 */
const API_URL = process.env.API_URL || "http://backend:3000";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://frontend";

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
  console.log(`\nGoFood Docker smoke test`);
  console.log(`  API:      ${API_URL}`);
  console.log(`  Frontend: ${FRONTEND_URL}\n`);

  let passed = 0;
  let total = 0;
  const check = async (name, fn) => {
    total++;
    if (await run(name, fn)) passed++;
  };

  await check("Backend GET /api/health", async () => {
    const r = await fetch(`${API_URL}/api/health`);
    const j = await r.json();
    if (!r.ok || !j.success) throw new Error(JSON.stringify(j));
  });

  await check("Frontend GET /", async () => {
    const r = await fetch(FRONTEND_URL);
    if (!r.ok) throw new Error(`status ${r.status}`);
    const html = await r.text();
    if (!html.includes("GoFood") && !html.includes("root")) {
      throw new Error("unexpected HTML");
    }
  });

  await check("Frontend proxies GET /api/health", async () => {
    const r = await fetch(`${FRONTEND_URL}/api/health`);
    const j = await r.json();
    if (!r.ok || !j.success) throw new Error(JSON.stringify(j));
  });

  await check("Backend POST /api/display/fooditems", async () => {
    const r = await fetch(`${API_URL}/api/display/fooditems`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    const j = await r.json();
    if (!j[0]?.length) throw new Error("empty menu");
  });

  await check("Frontend proxies POST /api/display/fooditems", async () => {
    const r = await fetch(`${FRONTEND_URL}/api/display/fooditems`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    if (!r.ok) throw new Error(`status ${r.status}`);
  });

  await check("Auth signup + login + cash order", async () => {
    const email = `docker${Date.now()}@test.com`;
    const signup = await fetch(`${API_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Docker Test",
        email,
        password: "test12345",
        location: "Delhi",
      }),
    });
    if (!signup.ok) throw new Error(`signup ${signup.status}`);

    const loginRes = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "test12345" }),
    });
    const login = await loginRes.json();
    if (!login.authToken) throw new Error("login failed");

    const orderRes = await fetch(`${API_URL}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${login.authToken}`,
      },
      body: JSON.stringify({
        order_data: [{ name: "Docker Pizza", price: 99, qty: 1, size: "Regular" }],
        paymentMethod: "Cash",
      }),
    });
    const order = await orderRes.json();
    if (!order.success) throw new Error(JSON.stringify(order));
  });

  await check("GET /api/crypto/prices", async () => {
    const r = await fetch(`${API_URL}/api/crypto/prices`);
    const j = await r.json();
    if (!j.xrp?.usd) throw new Error("missing XRP price");
  });

  console.log(`\n${passed}/${total} passed\n`);
  process.exit(passed === total ? 0 : 1);
})();
