/**
 * Wallet auth tests — run: npm run test:wallet
 * Requires backend running (PORT from .env).
 */
require("../Config/env");

const {
  generateSeed,
  deriveKeypair,
  sign,
  deriveAddress,
} = require("ripple-keypairs");

const PORT = process.env.PORT || 3000;
const API = `http://localhost:${PORT}`;

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
  console.log(`\nWallet auth tests (${API})\n`);
  let passed = 0;
  let total = 0;

  const check = async (name, fn) => {
    total++;
    if (await run(name, fn)) passed++;
  };

  await check("Sandbox wallet login", async () => {
    const challengeRes = await fetch(`${API}/api/auth/wallet-challenge`);
    const challenge = await challengeRes.json();
    if (!challenge.nonce) throw new Error("no nonce");

    const loginRes = await fetch(`${API}/api/auth/wallet-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        walletAddress: "rSandbox1234567890abcdefghijklmnop",
        walletType: "sandbox",
        signature: `sandbox_${Buffer.from(challenge.nonce).toString("base64")}`,
        nonce: challenge.nonce,
      }),
    });
    const login = await loginRes.json();
    if (!login.authToken) throw new Error(JSON.stringify(login));
  });

  await check("Gem-style signature verification (ripple-keypairs)", async () => {
    const seed = generateSeed();
    const keypair = deriveKeypair(seed);
    const address = deriveAddress(keypair.publicKey);

    const challengeRes = await fetch(`${API}/api/auth/wallet-challenge`);
    const challenge = await challengeRes.json();
    const messageHex = Buffer.from(challenge.nonce, "utf8").toString("hex");
    const signature = sign(messageHex, keypair.privateKey);

    const loginRes = await fetch(`${API}/api/auth/wallet-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        walletAddress: address,
        walletType: "gem",
        signature,
        nonce: challenge.nonce,
        publicKey: keypair.publicKey,
      }),
    });
    const login = await loginRes.json();
    if (!login.authToken) throw new Error(JSON.stringify(login));
    if (login.user?.walletAddress !== address) throw new Error("wrong user address");
  });

  await check("Gem login rejects bad signature", async () => {
    const seed = generateSeed();
    const keypair = deriveKeypair(seed);
    const address = deriveAddress(keypair.publicKey);

    const challengeRes = await fetch(`${API}/api/auth/wallet-challenge`);
    const challenge = await challengeRes.json();

    const loginRes = await fetch(`${API}/api/auth/wallet-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        walletAddress: address,
        walletType: "gem",
        signature: "deadbeef",
        nonce: challenge.nonce,
        publicKey: keypair.publicKey,
      }),
    });
    if (loginRes.ok) throw new Error("expected 4xx for invalid signature");
  });

  console.log(`\n${passed}/${total} passed\n`);
  process.exit(passed === total ? 0 : 1);
})();
