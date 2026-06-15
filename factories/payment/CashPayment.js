const { PAYMENT_METHODS } = require("../../constants/paymentMethods");
const { PAYMENT_STATUS } = require("../../constants/orderStatus");

class CashPayment {
  process(meta) {
    return {
      ...meta,
      paymentMethod: PAYMENT_METHODS.CASH,
      paymentStatus: PAYMENT_STATUS.PENDING,
    };
  }
}

module.exports = CashPayment;
