const mongoose = require("mongoose");
const FoodRepository = require("../../repositories/FoodRepository");
const { migrateOrderIndexes } = require("../../utils/orderIndexMigration");
const { migrateUserIdentity } = require("../../utils/userIdentityMigration");

async function connect() {
  const env = require("../../Config/env");
  if (!env.URL) {
    throw new Error("No MongoDB URL configured");
  }
  await mongoose.connect(env.URL, { useNewUrlParser: true });
  console.log("[db] MongoDB connected");
  global.useMemoryDb = false;
  await migrateOrderIndexes();
  await migrateUserIdentity();
  await FoodRepository.ensureSeeded();
  return mongoose.connection;
}

module.exports = { connect };
