const mongoose = require("mongoose");

const foodCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, default: "" },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    CategoryName: { type: String, default: "" },
  },
  { timestamps: true, collection: "food_category" }
);

foodCategorySchema.index({ name: 1 });
foodCategorySchema.index({ isActive: 1, sortOrder: 1 });

module.exports = mongoose.model("FoodCategory", foodCategorySchema);
