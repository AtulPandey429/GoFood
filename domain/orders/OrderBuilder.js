const { v4: uuidv4 } = require("uuid");
const mongoose = require("mongoose");
const { DELIVERY_STATUS, PAYMENT_STATUS } = require("../../constants/orderStatus");
const { PAYMENT_METHODS, CRYPTO_ASSETS } = require("../../constants/paymentMethods");
const { hasRealEmail } = require("../../utils/userIdentity");

class OrderBuilder {
  static fromCart(cartItems, paymentMeta, user) {
    const rawUserId = user?._id || user?.id || null;
    const userId =
      rawUserId && mongoose.Types.ObjectId.isValid(String(rawUserId))
        ? rawUserId
        : undefined;
    const userEmail = hasRealEmail(user) ? user.email : "";
    const customerWallet = user?.walletAddress || "";

    const items = (cartItems || []).map((item) => {
      const lineTotal = Number(item.price) || 0;
      const qty = item.qty || 1;
      const unitPrice = qty > 0 ? lineTotal / qty : lineTotal;
      return {
        foodItemId: String(item.id || item._id || ""),
        name: item.name,
        qty,
        size: item.size || "",
        unitPrice,
        lineTotal,
        img: item.img || "",
        price: lineTotal,
      };
    });

    const totalInr = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const orderId = uuidv4();
    const now = new Date();

    return {
      orderId,
      userId: userId && String(userId).length === 24 ? userId : undefined,
      userEmail,
      customerWallet,
      items,
      totalInr,
      payment: {
        method: paymentMeta.paymentMethod || PAYMENT_METHODS.CASH,
        status: paymentMeta.paymentStatus || PAYMENT_STATUS.PENDING,
        cryptoAsset: paymentMeta.cryptoAsset || CRYPTO_ASSETS.NONE,
        cryptoAmount: Math.round(Number(paymentMeta.cryptoAmount || 0) * 100) / 100,
        txHash: paymentMeta.txHash || "",
        fromAddress: paymentMeta.fromAddress || "",
        toAddress: paymentMeta.toAddress || "",
        verifiedAt: paymentMeta.verifiedAt || null,
        ledgerIndex: paymentMeta.ledgerIndex || null,
        verificationNote: paymentMeta.verificationNote || "",
      },
      delivery: {
        status: DELIVERY_STATUS.PLACED,
      },
      timeline: [
        {
          status: DELIVERY_STATUS.PLACED,
          note: "Order received",
          at: now,
          actor: "system",
        },
      ],
      createdAt: now,
      updatedAt: now,
    };
  }
}

module.exports = OrderBuilder;
