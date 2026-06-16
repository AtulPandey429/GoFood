const env = require("../../Config/env");
const { validateTelegramChatId } = require("../../utils/securityValidators");
const { formatOrderNotification } = require("../../utils/orderNotificationFormat");

function buildOrderLink(order) {
  const meta = order?.metadata || order || {};
  const orderId = order?.orderId || meta.orderId;
  const base =
    (env.TELEGRAM_PUBLIC_APP_URL || "").replace(/\/+$/, "") ||
    (env.CLIENT_URL || "https://gofood-latest.onrender.com").replace(/\/+$/, "");

  if (orderId) {
    return `${base}/order/success/${encodeURIComponent(orderId)}`;
  }
  return `${base}/myOrder`;
}

class TelegramNotifier {
  async send(user, payload) {
    const check = validateTelegramChatId(user.notifications?.telegramChatId);
    if (!check.valid || !check.chatId || !env.TELEGRAM_BOT_TOKEN) {
      throw new Error("Telegram not configured");
    }

    const text = this._formatMessage(payload);
    const order = payload?.order || {};
    const firstWithImg = Array.isArray(order.items)
      ? order.items.find((item) => item && item.img)
      : null;
    const photo = firstWithImg?.img;

    const endpoint = photo ? "sendPhoto" : "sendMessage";
    const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${endpoint}`;

    const body = photo
      ? {
          chat_id: check.chatId,
          photo,
          caption: text,
          parse_mode: "HTML",
        }
      : {
          chat_id: check.chatId,
          text,
          parse_mode: "HTML",
        };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
    const base = formatOrderNotification(payload);
    const link = buildOrderLink(payload.order);
    return `${base}\n\n<a href="${link}">View your order</a>`;
  }
}

module.exports = TelegramNotifier;
