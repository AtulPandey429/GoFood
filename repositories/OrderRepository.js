const mongoose = require("mongoose");
const OrderMapper = require("../domain/orders/OrderMapper");

const memoryOrders = new Map();

function flattenPatch(patch) {
  const set = {};
  Object.entries(patch || {}).forEach(([key, value]) => {
    if (key === "payment" && value && typeof value === "object") {
      Object.entries(value).forEach(([pk, pv]) => {
        set[`payment.${pk}`] = pv;
      });
    } else if (key === "delivery" && value && typeof value === "object") {
      Object.entries(value).forEach(([dk, dv]) => {
        set[`delivery.${dk}`] = dv;
      });
    } else if (key !== "timeline") {
      set[key] = value;
    }
  });
  return { set };
}

function deepMerge(target, source) {
  const out = { ...target };
  Object.entries(source || {}).forEach(([key, value]) => {
    if (value && typeof value === "object" && !Array.isArray(value) && key !== "verifiedAt") {
      out[key] = deepMerge(out[key] || {}, value);
    } else {
      out[key] = value;
    }
  });
  return out;
}

function aggregateMemoryStats(list) {
  let totalRevenueInr = 0;
  let totalRevenueXrp = 0;
  let totalRevenueXlm = 0;
  const dailyRevenue = {};

  list.forEach((order) => {
    totalRevenueInr += order.totalInr || 0;
    if (order.payment?.cryptoAsset === "XRP") totalRevenueXrp += order.payment.cryptoAmount || 0;
    if (order.payment?.cryptoAsset === "XLM") totalRevenueXlm += order.payment.cryptoAmount || 0;
    const date = order.createdAt
      ? new Date(order.createdAt).toISOString().split("T")[0]
      : "unknown";
    dailyRevenue[date] = (dailyRevenue[date] || 0) + (order.totalInr || 0);
  });

  const chartData = Object.entries(dailyRevenue)
    .map(([date, revenue]) => ({ date, revenue }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return {
    totalOrders: list.length,
    totalRevenueInr,
    totalRevenueXrp,
    totalRevenueXlm,
    chartData,
  };
}

const OrderRepository = {
  _useMemory() {
    return global.useMemoryDb === true || mongoose.connection.readyState !== 1;
  },

  _model() {
    return require("../model/Order");
  },

  async create(orderDoc) {
    if (this._useMemory()) {
      const copy = JSON.parse(JSON.stringify(orderDoc));
      memoryOrders.set(copy.orderId, copy);
      return copy;
    }

    const Order = this._model();
    const doc = await Order.create(orderDoc);
    return OrderMapper.toPlain(doc);
  },

  async findByOrderId(orderId) {
    if (this._useMemory()) {
      return memoryOrders.get(orderId) || null;
    }

    const Order = this._model();
    return Order.findOne({ orderId }).lean();
  },

  async findByUserId(userId, { limit = 100, skip = 0 } = {}) {
    const id = String(userId);
    if (this._useMemory()) {
      return Array.from(memoryOrders.values())
        .filter((o) => String(o.userId) === id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(skip, skip + limit);
    }

    const Order = this._model();
    return Order.find({ userId: id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  },

  async findByUserEmail(email, { limit = 100, skip = 0 } = {}) {
    if (this._useMemory()) {
      return Array.from(memoryOrders.values())
        .filter((o) => o.userEmail === email)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(skip, skip + limit);
    }

    const Order = this._model();
    return Order.find({ userEmail: email })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  },

  async findOrderByTxHash(txHash) {
    if (!txHash) return null;

    let doc = null;
    if (this._useMemory()) {
      doc = Array.from(memoryOrders.values()).find((o) => o.payment?.txHash === txHash) || null;
    } else {
      const Order = this._model();
      doc = await Order.findOne({ "payment.txHash": txHash }).lean();
    }

    return doc ? OrderMapper.toAdminView(doc) : null;
  },

  async updateByOrderId(orderId, flatUpdates) {
    const patch = OrderMapper.buildPaymentPatch(flatUpdates);

    if (this._useMemory()) {
      const existing = memoryOrders.get(orderId);
      if (!existing) return null;
      const updated = deepMerge(existing, patch);
      updated.updatedAt = new Date();
      memoryOrders.set(orderId, updated);
      return updated;
    }

    const Order = this._model();
    const { set } = flattenPatch(patch);
    return Order.findOneAndUpdate({ orderId }, { $set: set }, { new: true }).lean();
  },

  async updateOrderByOrderId(orderId, updates) {
    return this.updateByOrderId(orderId, updates);
  },

  async appendTimeline(orderId, event) {
    const entry = {
      status: event.status,
      note: event.note || "",
      at: event.at || new Date(),
      actor: event.actor || "system",
    };

    if (this._useMemory()) {
      const existing = memoryOrders.get(orderId);
      if (!existing) return null;
      existing.timeline = existing.timeline || [];
      existing.timeline.push(entry);
      existing.updatedAt = new Date();
      memoryOrders.set(orderId, existing);
      return existing;
    }

    const Order = this._model();
    return Order.findOneAndUpdate(
      { orderId },
      { $push: { timeline: entry } },
      { new: true }
    ).lean();
  },

  async findAll({ limit = 50, skip = 0, filters = {} } = {}) {
    if (this._useMemory()) {
      let list = Array.from(memoryOrders.values());
      if (filters.deliveryStatus) {
        list = list.filter((o) => o.delivery?.status === filters.deliveryStatus);
      }
      return list
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(skip, skip + limit);
    }

    const Order = this._model();
    const query = {};
    if (filters.deliveryStatus) {
      query["delivery.status"] = filters.deliveryStatus;
    }
    return Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
  },

  async aggregateStats() {
    if (this._useMemory()) {
      return aggregateMemoryStats(Array.from(memoryOrders.values()));
    }

    const Order = this._model();
    if (mongoose.connection.readyState !== 1) {
      return {
        totalOrders: 0,
        totalRevenueInr: 0,
        totalRevenueXrp: 0,
        totalRevenueXlm: 0,
        chartData: [],
      };
    }

    const [totals] = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenueInr: { $sum: "$totalInr" },
          totalRevenueXrp: {
            $sum: {
              $cond: [{ $eq: ["$payment.cryptoAsset", "XRP"] }, "$payment.cryptoAmount", 0],
            },
          },
          totalRevenueXlm: {
            $sum: {
              $cond: [{ $eq: ["$payment.cryptoAsset", "XLM"] }, "$payment.cryptoAmount", 0],
            },
          },
        },
      },
    ]);

    const daily = await Order.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          revenue: { $sum: "$totalInr" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return {
      totalOrders: totals?.totalOrders || 0,
      totalRevenueInr: totals?.totalRevenueInr || 0,
      totalRevenueXrp: totals?.totalRevenueXrp || 0,
      totalRevenueXlm: totals?.totalRevenueXlm || 0,
      chartData: daily.map((d) => ({ date: d._id, revenue: d.revenue })),
    };
  },

  toSummary(doc) {
    return OrderMapper.toSummary(doc);
  },

  toAdminView(doc) {
    return OrderMapper.toAdminView(doc);
  },

  toNotificationShape(doc) {
    return OrderMapper.toNotificationShape(doc);
  },
};

module.exports = OrderRepository;
