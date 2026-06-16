const mongoose = require("mongoose");

const coinLedgerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true, index: true },
    type: { type: String, enum: ["earn", "spend"], required: true },
    amount: { type: Number, required: true },
    orderId: { type: String, default: "" },
    reason: { type: String, default: "" },
    balanceAfter: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "coin_ledger" }
);

coinLedgerSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("CoinLedger", coinLedgerSchema);
