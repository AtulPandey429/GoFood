const { PAYMENT_STATUS } = require("../../constants/orderStatus");
const { getDisplayIdentity } = require("../../utils/userIdentity");

class OrderMapper {
  static toPlain(doc) {
    if (!doc) return null;
    if (doc.toObject) return doc.toObject();
    return { ...doc };
  }

  static toSummary(doc) {
    const order = OrderMapper.toPlain(doc);
    if (!order) return null;

    const items = (order.items || []).map((item) => ({
      name: item.name,
      qty: item.qty,
      size: item.size,
      price: item.lineTotal ?? item.price ?? 0,
      img: item.img,
    }));

    const createdAt = order.createdAt
      ? new Date(order.createdAt).toISOString()
      : null;
    const orderDate = createdAt
      ? new Date(createdAt).toDateString()
      : "";

    return {
      orderId: order.orderId,
      orderDate,
      paymentMethod: order.payment?.method || "Cash",
      paymentStatus: order.payment?.status || PAYMENT_STATUS.PENDING,
      deliveryStatus: order.delivery?.status || "Placed",
      cryptoAsset: order.payment?.cryptoAsset || "None",
      cryptoAmount: order.payment?.cryptoAmount || 0,
      txHash: order.payment?.txHash || "",
      fromAddress: order.payment?.fromAddress || "",
      verificationNote: order.payment?.verificationNote || "",
      verifiedAt: order.payment?.verifiedAt || null,
      createdAt,
      totalInr: order.totalInr ?? items.reduce((s, i) => s + (i.price || 0), 0),
      items,
      timeline: order.timeline || [],
    };
  }

  static toAdminView(doc) {
    const order = OrderMapper.toPlain(doc);
    if (!order) return null;

    const summary = OrderMapper.toSummary(order);
    const items = (order.items || []).map((item) => ({
      name: item.name,
      qty: item.qty,
      size: item.size,
      price: item.unitPrice ?? (item.qty ? item.lineTotal / item.qty : item.lineTotal),
      img: item.img,
    }));

    return {
      orderId: order.orderId,
      userId: order.userId,
      email: order.userEmail || "",
      customerWallet: order.customerWallet || "",
      displayIdentity: getDisplayIdentity({
        userEmail: order.userEmail,
        customerWallet: order.customerWallet,
        walletAddress: order.customerWallet,
      }),
      metadata: {
        orderId: order.orderId,
        Order_date: summary.orderDate,
        paymentMethod: order.payment?.method,
        paymentStatus: order.payment?.status,
        deliveryStatus: order.delivery?.status,
        cryptoAsset: order.payment?.cryptoAsset,
        cryptoAmount: order.payment?.cryptoAmount,
        txHash: order.payment?.txHash,
        fromAddress: order.payment?.fromAddress,
        toAddress: order.payment?.toAddress,
        verificationNote: order.payment?.verificationNote,
        verifiedAt: order.payment?.verifiedAt,
        createdAt: summary.createdAt,
      },
      items,
      totalInr: order.totalInr,
      timeline: order.timeline || [],
    };
  }

  static toNotificationShape(doc) {
    return OrderMapper.toAdminView(doc);
  }

  static buildPaymentPatch(flatUpdates) {
    const payment = {};
    const delivery = {};
    const topLevel = {};

    const paymentFields = {
      paymentStatus: "status",
      paymentMethod: "method",
      cryptoAsset: "cryptoAsset",
      cryptoAmount: "cryptoAmount",
      txHash: "txHash",
      fromAddress: "fromAddress",
      toAddress: "toAddress",
      verifiedAt: "verifiedAt",
      ledgerIndex: "ledgerIndex",
      verificationNote: "verificationNote",
    };

    Object.entries(flatUpdates || {}).forEach(([key, value]) => {
      if (key === "deliveryStatus") {
        delivery.status = value;
      } else if (paymentFields[key]) {
        payment[paymentFields[key]] = value;
      } else {
        topLevel[key] = value;
      }
    });

    const patch = { ...topLevel };
    if (Object.keys(payment).length) patch.payment = payment;
    if (Object.keys(delivery).length) patch.delivery = delivery;
    return patch;
  }
}

module.exports = OrderMapper;
