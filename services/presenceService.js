const eventBus = require("./eventBus");

/** userId -> { meta, connectionCount } */
const sessions = new Map();

function getSnapshot() {
  const users = Array.from(sessions.values()).map((s) => s.meta);
  return {
    onlineCount: users.length,
    users,
  };
}

function publish() {
  eventBus.publish("presence:update", getSnapshot());
}

const presenceService = {
  connect(user) {
    const id = String(user.id);
    const existing = sessions.get(id);
    if (existing) {
      existing.connectionCount += 1;
    } else {
      sessions.set(id, {
        meta: {
          id,
          email: user.email,
          name: user.name || user.email,
          role: user.role || "user",
          connectedAt: new Date().toISOString(),
        },
        connectionCount: 1,
      });
    }
    publish();
  },

  disconnect(userId) {
    const id = String(userId);
    const existing = sessions.get(id);
    if (!existing) return;
    existing.connectionCount -= 1;
    if (existing.connectionCount <= 0) {
      sessions.delete(id);
    }
    publish();
  },

  getSnapshot,

  isOnline(userId) {
    return sessions.has(String(userId));
  },
};

module.exports = presenceService;
