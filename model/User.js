const mongoose = require("mongoose");
const crypto = require("crypto");
const { ROLES } = require("../constants/roles");
const { isPlaceholderEmail } = require("../utils/userIdentity");

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

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    location: { type: String, default: "" },
    email: {
      type: String,
      unique: true,
      sparse: true,
      validate: {
        validator(value) {
          if (!value) return true;
          return !isPlaceholderEmail(value);
        },
        message: "Use a real email address",
      },
    },
    password: {
      type: String,
      required: function () {
        return !this.walletAddress;
      },
      default: function () {
        return crypto.randomBytes(32).toString("hex");
      },
    },
    role: { type: String, enum: [ROLES.ADMIN, ROLES.USER], default: ROLES.USER },
    isAdmin: { type: Boolean, default: false },
    walletAddress: { type: String, unique: true, sparse: true },
    walletType: { type: String, enum: ["gem", "freighter", "sandbox", null], default: null },
    notifications: { type: notificationSchema, default: () => ({}) },
    coinBalance: { type: Number, default: 0, min: 0 },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Users", userSchema);
