const { foodCategories, foodItems } = require("../../seeds/foodSeed");

function seedGlobals() {
  global.food_items = foodItems;
  global.foodCategory = foodCategories;
  global.useMemoryDb = true;
  console.log("[db] Loaded in-memory seed data");
}

module.exports = { seedGlobals };
