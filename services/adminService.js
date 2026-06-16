const UserRepository = require("../repositories/UserRepository");
const OrderRepository = require("../repositories/OrderRepository");
const FoodRepository = require("../repositories/FoodRepository");
const orderStatusService = require("./orderStatusService");
const notificationService = require("./notificationService");
const eventBus = require("./eventBus");
const presenceService = require("./presenceService");
const menuAgentService = require("./menuAgentService");

const adminService = {
  async getStats() {
    const [userCount, orderStats, presence] = await Promise.all([
      UserRepository.count(),
      OrderRepository.aggregateStats(),
      Promise.resolve(presenceService.getSnapshot()),
    ]);

    return {
      totalUsers: userCount,
      onlineUsers: presence.onlineCount,
      totalOrders: orderStats.totalOrders,
      totalRevenueInr: orderStats.totalRevenueInr,
      totalRevenueXrp: orderStats.totalRevenueXrp,
      totalRevenueXlm: orderStats.totalRevenueXlm,
      chartData: orderStats.chartData,
    };
  },

  async getOrders({ limit = 50, skip = 0 } = {}) {
    const docs = await OrderRepository.findAll({ limit, skip });
    return docs.map((doc) => OrderRepository.toAdminView(doc));
  },

  async updateOrderStatus(orderId, deliveryStatus) {
    const doc = await OrderRepository.findByOrderId(orderId);
    if (!doc) throw new Error("Order not found");

    const currentStatus = doc.delivery?.status || "Placed";
    orderStatusService.validateTransition(currentStatus, deliveryStatus);

    await OrderRepository.updateOrderByOrderId(orderId, { deliveryStatus });
    await OrderRepository.appendTimeline(orderId, {
      status: deliveryStatus,
      note: `Status updated to ${deliveryStatus}`,
      actor: "admin",
    });

    const order = OrderRepository.toAdminView(
      await OrderRepository.findByOrderId(orderId)
    );

    eventBus.publish("order:update", {
      userId: order.userId ? String(order.userId) : undefined,
      email: order.email,
      orderId,
      deliveryStatus,
      paymentStatus: order.metadata?.paymentStatus,
    });

    const user = order.userId
      ? await UserRepository.findById(order.userId)
      : await UserRepository.findByEmail(order.email);
    if (user) {
      const eventMap = {
        Preparing: "status_preparing",
        Dispatched: "status_dispatched",
        Delivered: "status_delivered",
      };
      await notificationService.notifyUser(user, eventMap[deliveryStatus] || "status_update", order);
    }

    return order;
  },

  async getUsers() {
    const users = await UserRepository.findAll();
    return users.map((u) => UserRepository.toSafeUser(u));
  },

  async getFoodItems() {
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

  async suggestMenuItem(prompt) {
    const { items } = await FoodRepository.getAll();
    const categories = [...new Set(items.map((i) => i.CategoryName).filter(Boolean))];
    const itemNames = items.map((i) => i.name);
    const usedImages = items.map((i) => i.img).filter(Boolean);
    return menuAgentService.suggestFromPrompt(prompt, { categories, itemNames, usedImages });
  },

  async createMenuItemFromPrompt(prompt) {
    const { item } = await this.suggestMenuItem(prompt);
    const created = await FoodRepository.createItem(item);
    return { item: created, suggested: item };
  },

  getMenuAgentStatus() {
    return menuAgentService.getStatus();
  },
};

module.exports = adminService;
