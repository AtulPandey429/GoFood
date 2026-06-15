const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const { DELIVERY_STATUS, PAYMENT_STATUS } = require("../constants/orderStatus");
const { PAYMENT_METHODS, CRYPTO_ASSETS } = require("../constants/paymentMethods");

const memoryOrders = {};

const OrderRepository = {
  _useMemory() {
    return global.useMemoryDb === true || mongoose.connection.readyState !== 1;
  },

  async findByEmail(email) {
    if (this._useMemory()) {
      return memoryOrders[email] || null;
    }
    const Order = require("../model/Order");
    return Order.findOne({ email });
  },

  async create(email, orderData) {
    if (this._useMemory()) {
      memoryOrders[email] = { email, order_data: [orderData] };
      return memoryOrders[email];
    }
    const Order = require("../model/Order");
    return Order.create({ email, order_data: [orderData] });
  },

  async pushOrder(email, orderData) {
    if (this._useMemory()) {
      if (!memoryOrders[email]) {
        memoryOrders[email] = { email, order_data: [orderData] };
      } else {
        memoryOrders[email].order_data.push(orderData);
      }
      return memoryOrders[email];
    }
    const Order = require("../model/Order");
    return Order.findOneAndUpdate(
      { email },
      { $push: { order_data: orderData } },
      { new: true }
    );
  },

  async findAll() {
    if (this._useMemory()) {
      return Object.values(memoryOrders);
    }
    const Order = require("../model/Order");
    return Order.find({}).lean();
  },

  async updateOrderByOrderId(orderId, updates) {
    const all = await this.findAll();
    for (const doc of all) {
      let changed = false;
      const updatedData = doc.order_data.map((batch) => {
        if (Array.isArray(batch) && batch[0] && batch[0].orderId === orderId) {
          changed = true;
          return [{ ...batch[0], ...updates }, ...batch.slice(1)];
        }
        return batch;
      });
      if (changed) {
        if (this._useMemory()) {
          memoryOrders[doc.email].order_data = updatedData;
          return memoryOrders[doc.email];
        }
        const Order = require("../model/Order");
        return Order.findOneAndUpdate(
          { email: doc.email },
          { order_data: updatedData },
          { new: true }
        );
      }
    }
    return null;
  },

  flattenOrders() {
    return this.findAll().then((docs) => {
      const orders = [];
      docs.forEach((doc) => {
        doc.order_data.forEach((batch) => {
          if (Array.isArray(batch) && batch[0]) {
            orders.push({
              email: doc.email,
              orderId: batch[0].orderId,
              metadata: batch[0],
              items: batch.slice(1),
            });
          }
        });
      });
      return orders;
    });
  },

  async findOrderByTxHash(txHash) {
    if (!txHash) return null;
    const orders = await this.flattenOrders();
    return orders.find((o) => o.metadata?.txHash === txHash) || null;
  },

  buildOrderBatch(cartItems, paymentMeta = {}) {
    const metadata = {
      orderId: uuidv4(),
      Order_date: new Date().toDateString(),
      paymentMethod: paymentMeta.paymentMethod || PAYMENT_METHODS.CASH,
      cryptoAsset: paymentMeta.cryptoAsset || CRYPTO_ASSETS.NONE,
      cryptoAmount: paymentMeta.cryptoAmount || 0,
      txHash: paymentMeta.txHash || "",
      fromAddress: paymentMeta.fromAddress || "",
      toAddress: paymentMeta.toAddress || "",
      verifiedAt: paymentMeta.verifiedAt || null,
      ledgerIndex: paymentMeta.ledgerIndex || null,
      paymentStatus: paymentMeta.paymentStatus || PAYMENT_STATUS.PENDING,
      deliveryStatus: DELIVERY_STATUS.PLACED,
      createdAt: new Date().toISOString(),
    };
    return [metadata, ...cartItems];
  },
};

module.exports = OrderRepository;
