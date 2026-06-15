const UserRepository = require("../repositories/UserRepository");
const OrderRepository = require("../repositories/OrderRepository");
const FoodRepository = require("../repositories/FoodRepository");
const orderStatusService = require("./orderStatusService");
const notificationService = require("./notificationService");
const eventBus = require("./eventBus");

const adminService = {
  async getStats() {
    const [userCount, orders] = await Promise.all([
      UserRepository.count(),
      OrderRepository.flattenOrders(),
    ]);

    let totalRevenueInr = 0;
    let totalRevenueXrp = 0;
    let totalRevenueXlm = 0;
    const dailyRevenue = {};

    orders.forEach((order) => {
      const items = order.items || [];
      const dayTotal = items.reduce((sum, item) => sum + (item.price || 0) * (item.qty || 1), 0);
      totalRevenueInr += dayTotal;

      const meta = order.metadata || {};
      if (meta.cryptoAsset === "XRP") totalRevenueXrp += meta.cryptoAmount || 0;
      if (meta.cryptoAsset === "XLM") totalRevenueXlm += meta.cryptoAmount || 0;

      const date = meta.Order_date || meta.createdAt?.split("T")[0] || "unknown";
      dailyRevenue[date] = (dailyRevenue[date] || 0) + dayTotal;
    });

    const chartData = Object.entries(dailyRevenue)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    return {
      totalUsers: userCount,
      totalOrders: orders.length,
      totalRevenueInr,
      totalRevenueXrp,
      totalRevenueXlm,
      chartData,
    };
  },

  async getOrders() {
    return OrderRepository.flattenOrders();
  },

  async updateOrderStatus(orderId, deliveryStatus) {
    const orders = await OrderRepository.flattenOrders();
    const order = orders.find((o) => o.orderId === orderId);
    if (!order) throw new Error("Order not found");

    orderStatusService.validateTransition(order.metadata.deliveryStatus, deliveryStatus);

    const updated =     await OrderRepository.updateOrderByOrderId(orderId, {
      deliveryStatus,
    });

    eventBus.publish("order:update", {
      email: order.email,
      orderId,
      deliveryStatus,
      paymentStatus: order.metadata?.paymentStatus,
    });

    const user = await UserRepository.findByEmail(order.email);
    if (user) {
      const eventMap = {
        Preparing: "status_preparing",
        Dispatched: "status_dispatched",
        Delivered: "status_delivered",
      };
      await notificationService.notifyUser(user, eventMap[deliveryStatus] || "status_update", order);
    }

    return updated;
  },

  async getUsers() {
    return UserRepository.findAll();
  },

  getFoodItems() {
    return FoodRepository.getAll();
  },

  async createFoodItem(item) {
    return FoodRepository.createItem(item);
  },

  async updateFoodItem(id, updates) {
    return FoodRepository.updateItem(id, updates);
  },

  async deleteFoodItem(id) {
    return FoodRepository.deleteItem(id);
  },
};

module.exports = adminService;
