const mongoose = require("mongoose");
const env = require("../../Config/env");
const { seedGlobals } = require("./InMemoryAdapter");
const { foodCategories, foodItems } = require("../../seeds/foodSeed");

async function loadFoodData(connection) {
  const db = connection.db;
  const itemsCol = db.collection("food_items");
  const catCol = db.collection("food_category");

  let items = await itemsCol.find({}).toArray();
  let categories = await catCol.find({}).toArray();

  if (items.length === 0) {
    await itemsCol.insertMany(foodItems);
    items = foodItems;
    console.log("[db] Seeded food_items collection");
  }

  if (categories.length === 0) {
    await catCol.insertMany(foodCategories);
    categories = foodCategories;
    console.log("[db] Seeded food_category collection");
  }

  global.food_items = items;
  global.foodCategory = categories;
}

async function connect() {
  if (!env.URL) {
    throw new Error("No MongoDB URL configured");
  }
  await mongoose.connect(env.URL, { useNewUrlParser: true });
  console.log("[db] MongoDB connected");
  global.useMemoryDb = false;
  await loadFoodData(mongoose.connection);
  return mongoose.connection;
}

module.exports = { connect, loadFoodData };
