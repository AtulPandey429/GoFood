const FoodRepository = require("../../repositories/FoodRepository");

function seedGlobals() {
  global.useMemoryDb = true;
  return FoodRepository.ensureSeeded().then(() => {
    console.log("[db] Using in-memory storage (no MongoDB)");
  });
}

module.exports = { seedGlobals };
