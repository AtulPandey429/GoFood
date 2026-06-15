const env = require("../../Config/env");

class ConsoleNotifier {
  async send(user, payload) {
    console.log("[notification:console]", {
      user: user.email || user.walletAddress,
      event: payload.event,
      orderId: payload.order?.orderId || payload.order?.metadata?.orderId,
    });
    return { success: true };
  }

  async testConnection() {
    return { success: true, message: "Console notifier active (dev mode)" };
  }
}

module.exports = ConsoleNotifier;
