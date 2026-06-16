const LEGACY_ORDER_INDEXES = ["email_1"];

/**
 * Old schema: one document per user with unique `email` and nested `order_data`.
 * New schema: one document per order with `orderId` + `userEmail`.
 */
async function migrateOrderIndexes() {
  const Order = require("../model/Order");
  const collection = Order.collection;

  const legacyDelete = await collection.deleteMany({
    $or: [
      { orderId: { $exists: false } },
      { orderId: null },
      { order_data: { $exists: true } },
    ],
  });
  if (legacyDelete.deletedCount > 0) {
    console.log(`[db] Removed ${legacyDelete.deletedCount} legacy order document(s)`);
  }

  const indexes = await collection.indexes();
  for (const idx of indexes) {
    if (!LEGACY_ORDER_INDEXES.includes(idx.name)) continue;
    try {
      await collection.dropIndex(idx.name);
      console.log(`[db] Dropped legacy index orders.${idx.name}`);
    } catch (err) {
      console.warn(`[db] Could not drop index orders.${idx.name}:`, err.message);
    }
  }

  try {
    await Order.syncIndexes();
  } catch (err) {
    if (err.code === 11000 && err.keyPattern?.orderId) {
      try {
        await collection.dropIndex("orderId_1");
        console.log("[db] Rebuilding orders.orderId_1 index");
        await Order.syncIndexes();
      } catch (rebuildErr) {
        console.warn("[db] Order index sync failed:", rebuildErr.message);
        throw rebuildErr;
      }
    } else {
      throw err;
    }
  }
}

module.exports = { migrateOrderIndexes };
