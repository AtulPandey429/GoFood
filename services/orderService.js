const OrderRepository = require("../repositories/OrderRepository");
const UserRepository = require("../repositories/UserRepository");
const PaymentFactory = require("../factories/payment/PaymentFactory");
const paymentVerificationService = require("./paymentVerificationService");
const eventBus = require("./eventBus");
const { validateTxHash } = require("../utils/securityValidators");
const { PAYMENT_METHODS } = require("../constants/paymentMethods");
const { PAYMENT_STATUS } = require("../constants/orderStatus");

let notificationService = null;
const getNotificationService = () => {
  if (!notificationService) {
    notificationService = require("./notificationService");
  }
  return notificationService;
};

const orderService = {
  async createOrder(userEmail, body) {
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

    const batch = OrderRepository.buildOrderBatch(order_data, processed);
    const orderId = batch[0].orderId;

    const existingDoc = await OrderRepository.findByEmail(userEmail);
    if (!existingDoc) {
      await OrderRepository.create(userEmail, batch);
    } else {
      await OrderRepository.pushOrder(userEmail, batch);
    }

    if (paymentMeta.paymentMethod === PAYMENT_METHODS.CRYPTO) {
      await this._verifyAndUpdatePayment(userEmail, orderId, paymentMeta);
    }

    try {
      const user = await UserRepository.findByEmail(userEmail);
      if (user) {
        const orders = await OrderRepository.flattenOrders();
        const fullOrder = orders.find((o) => o.orderId === orderId);
        await getNotificationService().notifyUser(
          user,
          "order_placed",
          fullOrder || { orderId, metadata: batch[0], items: batch.slice(1) }
        );
      }
    } catch (e) {
      console.warn("[order] Notification failed:", e.message);
    }

    const updated = await OrderRepository.flattenOrders();
    const placed = updated.find((o) => o.orderId === orderId);

    return {
      success: true,
      orderId,
      paymentStatus: placed?.metadata?.paymentStatus || batch[0].paymentStatus,
    };
  },

  async _verifyAndUpdatePayment(userEmail, orderId, paymentMeta) {
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

    await OrderRepository.updateOrderByOrderId(orderId, updates);

    eventBus.publish("order:update", {
      email: userEmail,
      orderId,
      paymentStatus: updates.paymentStatus,
      deliveryStatus: "Placed",
      verificationNote: updates.verificationNote,
    });

    if (!result.verified && paymentMeta.txHash) {
      this._schedulePaymentRetry(userEmail, orderId, paymentMeta);
    }
  },

  _schedulePaymentRetry(userEmail, orderId, paymentMeta) {
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
        await OrderRepository.updateOrderByOrderId(orderId, updates);

        eventBus.publish("order:update", {
          email: userEmail,
          orderId,
          paymentStatus: updates.paymentStatus,
          deliveryStatus: "Placed",
          verificationNote: "",
        });

        const user = await UserRepository.findByEmail(userEmail);
        if (user) {
          const orders = await OrderRepository.flattenOrders();
          const fullOrder = orders.find((o) => o.orderId === orderId);
          if (fullOrder) {
            await getNotificationService().notifyUser(user, "payment_confirmed", fullOrder);
          }
        }
      } catch (e) {
        console.warn("[order] Payment retry failed:", e.message);
      }
    }, 30000);
  },

  async getOrderHistory(userEmail) {
    const doc = await OrderRepository.findByEmail(userEmail);
    return { orderData: doc };
  },
};

module.exports = orderService;
