const TelegramNotifier = require("./TelegramNotifier");
const DiscordNotifier = require("./DiscordNotifier");
const ConsoleNotifier = require("./ConsoleNotifier");

const NotificationFactory = {
  create(channel) {
    switch (channel) {
      case "telegram":
        return new TelegramNotifier();
      case "discord":
        return new DiscordNotifier();
      case "console":
      default:
        return new ConsoleNotifier();
    }
  },
};

module.exports = NotificationFactory;
