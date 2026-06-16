const mongoose = require("mongoose");

const inAppNotificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true, index: true },
    event: { type: String, required: true },
    title: { type: String, default: "" },
    body: { type: String, default: "" },
    orderId: { type: String, default: "" },
    channels: { type: [String], default: [] },
    read: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "notifications" }
);

inAppNotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model("InAppNotification", inAppNotificationSchema);
