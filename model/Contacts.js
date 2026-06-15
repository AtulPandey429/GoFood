const mongoose = require("mongoose");
const crypto = require("crypto");

const notificationSchema = {
  telegramChatId: { type: String, default: "" },
  discordWebhookUrl: { type: String, default: "" },
  enableTelegram: { type: Boolean, default: false },
  enableDiscord: { type: Boolean, default: false },
  telegramUserId: { type: String, default: "" },
  telegramUsername: { type: String, default: "" },
  telegramVerified: { type: Boolean, default: false },
  discordUserId: { type: String, default: "" },
  discordUsername: { type: String, default: "" },
  discordVerified: { type: Boolean, default: false },
};

const contactSchema = mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: {
    type: String,
    required: function () {
      return !this.walletAddress;
    },
    default: function () {
      return crypto.randomBytes(32).toString("hex");
    },
  },
  isAdmin: { type: Boolean, default: false },
  walletAddress: { type: String, unique: true, sparse: true },
  walletType: { type: String, enum: ["gem", "freighter", "sandbox", null], default: null },
  notifications: { type: notificationSchema, default: () => ({}) },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Users", contactSchema);
