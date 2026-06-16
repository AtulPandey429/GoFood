const mongoose = require("mongoose");

const optionSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const foodItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "FoodCategory" },
    CategoryName: { type: String, default: "" },
    price: { type: Number, required: true },
    img: { type: String, default: "" },
    description: { type: String, default: "" },
    options: { type: [optionSchema], default: [] },
    isActive: { type: Boolean, default: true },
    id: { type: Number },
  },
  { timestamps: true, collection: "food_items" }
);

foodItemSchema.index({ CategoryName: 1, isActive: 1 });
foodItemSchema.index({ isActive: 1 });

module.exports = mongoose.model("FoodItem", foodItemSchema);
