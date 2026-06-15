const NotificationFactory = require("../factories/notification/NotificationFactory");

const notificationService = {
  async notifyUser(user, event, order) {
    const channels = [];
    if (user.notifications?.enableTelegram) channels.push("telegram");
    if (user.notifications?.enableDiscord) channels.push("discord");
    if (!channels.length) channels.push("console");

    const results = await Promise.allSettled(
      channels.map(async (ch) => {
        const notifier = NotificationFactory.create(ch);
        return notifier.send(user, { event, order });
      })
    );

    return results;
  },

  async testNotification(user, channel) {
    const notifier = NotificationFactory.create(channel || "console");
    return notifier.testConnection(user);
  },
};

module.exports = notificationService;
