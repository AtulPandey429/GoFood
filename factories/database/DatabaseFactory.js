const MongoAdapter = require("./MongoAdapter");
const { seedGlobals } = require("./InMemoryAdapter");

async function initialize() {
  try {
    await MongoAdapter.connect();
    return { type: "mongo" };
  } catch (error) {
    const msg = error.message || "";
    console.warn("[db] MongoDB unavailable:", msg);
    if (/auth/i.test(msg)) {
      console.warn(
        "[db] Auth failed — check Atlas: correct username/password in URL, IP whitelisted, database user has readWrite on 'gofood'"
      );
    }
    await seedGlobals();
    return { type: "memory" };
  }
}

module.exports = { initialize };
