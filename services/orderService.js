const OrderRepository = require("../repositories/OrderRepository");
const UserRepository = require("../repositories/UserRepository");
const OrderBuilder = require("../domain/orders/OrderBuilder");
const PaymentFactory = require("../factories/payment/PaymentFactory");
const paymentVerificationService = require("./paymentVerificationService");
const eventBus = require("./eventBus");
const { validateTxHash } = require("../utils/securityValidators");
const { PAYMENT_METHODS } = require("../constants/paymentMethods");
const { PAYMENT_STATUS } = require("../constants/orderStatus");
const { hasRealEmail } = require("../utils/userIdentity");

let notificationService = null;
const getNotificationService = () => {
  if (!notificationService) {
    notificationService = require("./notificationService");
  }
  return notificationService;
};

function orderBelongsToUser(doc, user) {
  if (!doc || !user) return false;
  const userId = String(user._id || user.id);
  if (doc.userId && String(doc.userId) === userId) return true;
  if (hasRealEmail(user) && doc.userEmail === user.email) return true;
  if (user.walletAddress && doc.customerWallet === user.walletAddress) return true;
  return false;
}

function publishOrderUpdate(user, payload) {
  eventBus.publish("order:update", {
    userId: String(user._id || user.id),
    email: hasRealEmail(user) ? user.email : null,
    ...payload,
  });
}

const orderService = {
  async createOrder(userId, body) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 401;
      throw err;
    }

    const {
      order_data,
      paymentMethod,
      cryptoAsset,
      cryptoAmount,
      txHash,
      fromAddress,
    } = body;

    const paymentMeta = {
      paymentMethod: paymentMethod || "Cash",
      cryptoAsset: cryptoAsset || "None",
      cryptoAmount: Math.round(Number(cryptoAmount || 0) * 100) / 100,
      txHash: txHash || "",
      fromAddress: fromAddress || "",
    };

    if (paymentMeta.paymentMethod === PAYMENT_METHODS.CRYPTO) {
      const hashCheck = validateTxHash(paymentMeta.txHash, paymentMeta.cryptoAsset);
      if (!hashCheck.valid) {
        const err = new Error(hashCheck.message);
        err.statusCode = 400;
        throw err;
      }

      const existing = await OrderRepository.findOrderByTxHash(paymentMeta.txHash);
      if (existing) {
        const err = new Error("Transaction hash already used for another order");
        err.statusCode = 409;
        throw err;
      }
    }

    const processor = PaymentFactory.create(paymentMeta.paymentMethod, paymentMeta.cryptoAsset);
    const processed = processor.process(paymentMeta);
    const orderDoc = OrderBuilder.fromCart(order_data, processed, user);
    const orderId = orderDoc.orderId;

    await OrderRepository.create(orderDoc);

    if (paymentMeta.paymentMethod === PAYMENT_METHODS.CRYPTO) {
      await this._verifyAndUpdatePayment(user, orderId, paymentMeta);
    }

    try {
      const fullOrder = await OrderRepository.findByOrderId(orderId);
      await getNotificationService().notifyUser(
        user,
        "order_placed",
        OrderRepository.toNotificationShape(fullOrder)
      );
    } catch (e) {
      console.warn("[order] Notification failed:", e.message);
    }

    const placed = await OrderRepository.findByOrderId(orderId);
    const summary = OrderRepository.toSummary(placed);

    publishOrderUpdate(user, {
      orderId,
      deliveryStatus: "Placed",
      paymentStatus: placed?.payment?.status || "Paid",
    });

    return { success: true, ...summary };
  },

  async _verifyAndUpdatePayment(user, orderId, paymentMeta) {
    const result = await paymentVerificationService.verify({
      txHash: paymentMeta.txHash,
      cryptoAsset: paymentMeta.cryptoAsset,
      cryptoAmount: paymentMeta.cryptoAmount,
      fromAddress: paymentMeta.fromAddress,
    });

    const updates = {
      fromAddress: result.fromAddress || paymentMeta.fromAddress,
      toAddress: result.toAddress || "",
      verifiedAt: result.verifiedAt || null,
      ledgerIndex: result.ledgerIndex || null,
      paymentStatus: result.verified
        ? result.paymentStatus
        : PAYMENT_STATUS.PENDING,
      verificationNote: result.verified ? "" : result.reason || "Pending verification",
    };

    await OrderRepository.updateByOrderId(orderId, updates);

    if (result.verified) {
      await OrderRepository.appendTimeline(orderId, {
        status: "Paid",
        note: "Payment confirmed on-chain",
        actor: "system",
      });
    }

    publishOrderUpdate(user, {
      orderId,
      paymentStatus: updates.paymentStatus,
      deliveryStatus: "Placed",
      verificationNote: updates.verificationNote,
    });

    if (!result.verified && paymentMeta.txHash) {
      this._schedulePaymentRetry(user, orderId, paymentMeta);
    }
  },

  _schedulePaymentRetry(user, orderId, paymentMeta) {
    const userId = String(user._id || user.id);
    setTimeout(async () => {
      try {
        const result = await paymentVerificationService.verify({
          txHash: paymentMeta.txHash,
          cryptoAsset: paymentMeta.cryptoAsset,
          cryptoAmount: paymentMeta.cryptoAmount,
          fromAddress: paymentMeta.fromAddress,
        });
        if (!result.verified) return;

        const updates = {
          fromAddress: result.fromAddress || paymentMeta.fromAddress,
          toAddress: result.toAddress || "",
          verifiedAt: result.verifiedAt || null,
          ledgerIndex: result.ledgerIndex || null,
          paymentStatus: result.paymentStatus,
          verificationNote: "",
        };
        await OrderRepository.updateByOrderId(orderId, updates);
        await OrderRepository.appendTimeline(orderId, {
          status: "Paid",
          note: "Payment confirmed on-chain (retry)",
          actor: "system",
        });

        const freshUser = await UserRepository.findById(userId);
        if (freshUser) {
          publishOrderUpdate(freshUser, {
            orderId,
            paymentStatus: updates.paymentStatus,
            deliveryStatus: "Placed",
            verificationNote: "",
          });

          const fullOrder = await OrderRepository.findByOrderId(orderId);
          if (fullOrder) {
            await getNotificationService().notifyUser(
              freshUser,
              "payment_confirmed",
              OrderRepository.toNotificationShape(fullOrder)
            );
          }
        }
      } catch (e) {
        console.warn("[order] Payment retry failed:", e.message);
      }
    }, 30000);
  },

  async getOrderHistory(userId) {
    const docs = await OrderRepository.findByUserId(userId);
    const orders = docs.map((doc) => OrderRepository.toSummary(doc));
    return { orders };
  },

  async getOrderById(userId, orderId) {
    const user = await UserRepository.findById(userId);
    const doc = await OrderRepository.findByOrderId(orderId);
    if (!orderBelongsToUser(doc, user)) {
      const err = new Error("Order not found");
      err.statusCode = 404;
      throw err;
    }
    return OrderRepository.toSummary(doc);
  },
};

module.exports = orderService;
