const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true, index: true },
    orderId: { type: String, required: true, index: true },
    foodItemId: { type: String, default: "" },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, default: "" },
  },
  { timestamps: true, collection: "reviews" }
);

reviewSchema.index({ foodItemId: 1, createdAt: -1 });

module.exports = mongoose.model("Review", reviewSchema);
