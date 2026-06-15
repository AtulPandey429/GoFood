const CashPayment = require("./CashPayment");
const XrpPayment = require("./XrpPayment");
const XlmPayment = require("./XlmPayment");
const { PAYMENT_METHODS } = require("../../constants/paymentMethods");
const { CRYPTO_ASSETS } = require("../../constants/paymentMethods");

const PaymentFactory = {
  create(method, cryptoAsset) {
    if (method === PAYMENT_METHODS.CRYPTO) {
      if (cryptoAsset === CRYPTO_ASSETS.XLM) return new XlmPayment();
      return new XrpPayment();
    }
    return new CashPayment();
  },
};

module.exports = PaymentFactory;
