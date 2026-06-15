const mongoose = require("mongoose");
const { foodCategories, foodItems } = require("../seeds/foodSeed");

const FoodRepository = {
  getAll() {
    return {
      items: global.food_items || foodItems,
      categories: global.foodCategory || foodCategories,
    };
  },

  async refreshGlobals() {
    try {
      if (mongoose.connection.readyState === 1) {
        const db = mongoose.connection.db;
        global.food_items = await db.collection("food_items").find({}).toArray();
        global.foodCategory = await db.collection("food_category").find({}).toArray();
      }
    } catch (e) {
      // memory mode — globals already set
    }
    return this.getAll();
  },

  async createItem(item) {
    if (mongoose.connection.readyState === 1) {
      const db = mongoose.connection.db;
      const result = await db.collection("food_items").insertOne(item);
      item._id = result.insertedId;
    } else {
      item.id = Date.now();
      global.food_items.push(item);
    }
    await this.refreshGlobals();
    return item;
  },

  async updateItem(id, updates) {
    if (mongoose.connection.readyState === 1) {
      const db = mongoose.connection.db;
      await db.collection("food_items").updateOne(
        { $or: [{ _id: id }, { id: parseInt(id, 10) }] },
        { $set: updates }
      );
    } else {
      global.food_items = global.food_items.map((item) =>
        String(item.id) === String(id) || String(item._id) === String(id)
          ? { ...item, ...updates }
          : item
      );
    }
    await this.refreshGlobals();
    return updates;
  },

  async deleteItem(id) {
    if (mongoose.connection.readyState === 1) {
      const db = mongoose.connection.db;
      await db.collection("food_items").deleteOne({
        $or: [{ _id: id }, { id: parseInt(id, 10) }],
      });
    } else {
      global.food_items = global.food_items.filter(
        (item) => String(item.id) !== String(id) && String(item._id) !== String(id)
      );
    }
    await this.refreshGlobals();
  },
};

module.exports = FoodRepository;
