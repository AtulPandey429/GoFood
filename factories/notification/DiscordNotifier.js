const { formatOrderNotification } = require("../../utils/orderNotificationFormat");

class DiscordNotifier {
  async send(user, payload) {
    const { validateDiscordWebhookUrl } = require("../../utils/securityValidators");
    const webhookUrl = user.notifications?.discordWebhookUrl;
    const check = validateDiscordWebhookUrl(webhookUrl);
    if (!check.valid || !check.url) {
      throw new Error(check.message || "Discord webhook not configured");
    }

    const description = formatOrderNotification(payload).replace(/<[^>]+>/g, "");
    const embed = {
      title: "GoFood Order Update",
      description,
      color: 0x00ff88,
      timestamp: new Date().toISOString(),
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch(check.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embeds: [embed] }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error("Discord webhook error");
      return { success: true };
    } finally {
      clearTimeout(timeout);
    }
  }

  async testConnection(user) {
    return this.send(user, { event: "test", order: { orderId: "TEST" } });
  }
}

module.exports = DiscordNotifier;
