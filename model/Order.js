const mongoose = require("mongoose");
const { DELIVERY_STATUS, PAYMENT_STATUS } = require("../constants/orderStatus");
const { PAYMENT_METHODS, CRYPTO_ASSETS } = require("../constants/paymentMethods");

const orderItemSchema = new mongoose.Schema(
  {
    foodItemId: { type: String, default: "" },
    name: { type: String, required: true },
    qty: { type: Number, default: 1 },
    size: { type: String, default: "" },
    unitPrice: { type: Number, default: 0 },
    lineTotal: { type: Number, default: 0 },
    img: { type: String, default: "" },
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    method: { type: String, enum: [PAYMENT_METHODS.CASH, PAYMENT_METHODS.CRYPTO], default: PAYMENT_METHODS.CASH },
    status: { type: String, enum: Object.values(PAYMENT_STATUS), default: PAYMENT_STATUS.PENDING },
    cryptoAsset: { type: String, default: CRYPTO_ASSETS.NONE },
    cryptoAmount: { type: Number, default: 0 },
    txHash: { type: String, default: "" },
    fromAddress: { type: String, default: "" },
    toAddress: { type: String, default: "" },
    verifiedAt: { type: Date, default: null },
    ledgerIndex: { type: Number, default: null },
    verificationNote: { type: String, default: "" },
  },
  { _id: false }
);

const deliverySchema = new mongoose.Schema(
  {
    status: { type: String, default: DELIVERY_STATUS.PLACED },
  },
  { _id: false }
);

const timelineEventSchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    note: { type: String, default: "" },
    at: { type: Date, default: Date.now },
    actor: { type: String, enum: ["system", "admin", "user"], default: "system" },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Users", index: true },
    userEmail: { type: String, default: "", index: true },
    customerWallet: { type: String, default: "", index: true },
    items: { type: [orderItemSchema], default: [] },
    totalInr: { type: Number, default: 0 },
    payment: { type: paymentSchema, default: () => ({}) },
    delivery: { type: deliverySchema, default: () => ({}) },
    timeline: { type: [timelineEventSchema], default: [] },
  },
  { timestamps: true }
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ userEmail: 1, createdAt: -1 });
orderSchema.index({ "payment.txHash": 1 }, { unique: true, sparse: true });
orderSchema.index({ "delivery.status": 1, createdAt: -1 });

module.exports = mongoose.model("orders", orderSchema);
