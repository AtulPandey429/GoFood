const env = require("../../Config/env");
const { validateTelegramChatId } = require("../../utils/securityValidators");
const { formatOrderNotification } = require("../../utils/orderNotificationFormat");

class TelegramNotifier {
  async send(user, payload) {
    const check = validateTelegramChatId(user.notifications?.telegramChatId);
    if (!check.valid || !check.chatId || !env.TELEGRAM_BOT_TOKEN) {
      throw new Error("Telegram not configured");
    }
    const text = this._formatMessage(payload);
    const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: check.chatId, text, parse_mode: "HTML" }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error("Telegram API error");
      return { success: true };
    } finally {
      clearTimeout(timeout);
    }
  }

  async testConnection(user) {
    return this.send(user, {
      event: "test",
      order: {
        orderId: "test-order",
        metadata: {
          Order_date: new Date().toDateString(),
          paymentMethod: "Cash",
          paymentStatus: "Paid",
          deliveryStatus: "Placed",
        },
        items: [{ name: "Test Pizza", options: "Regular", qty: 1, price: 299 }],
      },
    });
  }

  _formatMessage(payload) {
    return formatOrderNotification(payload);
  }
}

module.exports = TelegramNotifier;
