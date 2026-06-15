const EventEmitter = require("events");

class AppEventBus extends EventEmitter {
  publish(channel, data) {
    this.emit(channel, data);
  }

  subscribe(channel, listener) {
    this.on(channel, listener);
    return () => this.off(channel, listener);
  }
}

module.exports = new AppEventBus();
