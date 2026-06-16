const mongoose = require("mongoose");
const FoodCategory = require("../model/FoodCategory");
const FoodItem = require("../model/FoodItem");

let memoryItems = [];
let memoryCategories = [];

function defaultOptions(price) {
  const base = Number(price) || 0;
  return [
    { label: "Full", price: base },
    { label: "Half", price: Math.round(base * 0.55) },
  ];
}

function foodItemQuery(id) {
  return mongoose.isValidObjectId(id)
    ? { $or: [{ _id: id }, { id: parseInt(id, 10) }] }
    : { id: parseInt(id, 10) };
}

const FoodRepository = {
  _useMemory() {
    return global.useMemoryDb === true || mongoose.connection.readyState !== 1;
  },

  async ensureSeeded() {
    return this.getAll();
  },

  async getAll() {
    if (this._useMemory()) {
      return { items: memoryItems, categories: memoryCategories };
    }

    const [items, categories] = await Promise.all([
      FoodItem.find({ isActive: { $ne: false } }).lean(),
      FoodCategory.find({ isActive: { $ne: false } }).sort({ sortOrder: 1 }).lean(),
    ]);

    return {
      items,
      categories: categories.map((c) => ({
        ...c,
        CategoryName: c.CategoryName || c.name,
      })),
    };
  },

  async createItem(item) {
    if (this._useMemory()) {
      const newItem = { ...item, id: item.id || Date.now() };
      memoryItems.push(newItem);
      return newItem;
    }

    const payload = {
      ...item,
      options: item.options?.length ? item.options : defaultOptions(item.price),
    };
    const created = await FoodItem.create(payload);
    return created.toObject ? created.toObject() : created;
  },

  async updateItem(id, updates) {
    if (this._useMemory()) {
      let updated = null;
      memoryItems = memoryItems.map((item) => {
        if (String(item.id) === String(id) || String(item._id) === String(id)) {
          updated = { ...item, ...updates };
          return updated;
        }
        return item;
      });
      if (!updated) throw new Error("Food item not found");
      return updated;
    }

    const payload = { ...updates };
    if (payload.price != null && !payload.options?.length) {
      payload.options = defaultOptions(payload.price);
    }
    const doc = await FoodItem.findOneAndUpdate(
      foodItemQuery(id),
      { $set: payload },
      { new: true }
    ).lean();
    if (!doc) throw new Error("Food item not found");
    return doc;
  },

  async deleteItem(id) {
    if (this._useMemory()) {
      memoryItems = memoryItems.filter(
        (item) => String(item.id) !== String(id) && String(item._id) !== String(id)
      );
      return;
    }

    await FoodItem.deleteOne(foodItemQuery(id));
  },
};

module.exports = FoodRepository;
