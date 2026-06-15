const { VALID_TRANSITIONS } = require("../constants/orderStatus");

const orderStatusService = {
  canTransition(from, to) {
    return (VALID_TRANSITIONS[from] || []).includes(to);
  },

  validateTransition(currentStatus, newStatus) {
    if (!this.canTransition(currentStatus, newStatus)) {
      throw new Error(`Cannot transition from ${currentStatus} to ${newStatus}`);
    }
    return true;
  },
};

module.exports = orderStatusService;
