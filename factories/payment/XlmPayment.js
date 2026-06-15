const { validateTxHash } = require("../../utils/securityValidators");
const { PAYMENT_METHODS, CRYPTO_ASSETS } = require("../../constants/paymentMethods");
const { PAYMENT_STATUS } = require("../../constants/orderStatus");

class XlmPayment {
  process(meta) {
    const check = validateTxHash(meta.txHash, CRYPTO_ASSETS.XLM);
    if (!check.valid) throw Object.assign(new Error(check.message), { statusCode: 400 });
    return {
      ...meta,
      paymentMethod: PAYMENT_METHODS.CRYPTO,
      cryptoAsset: CRYPTO_ASSETS.XLM,
      paymentStatus: PAYMENT_STATUS.PENDING,
    };
  }
}

module.exports = XlmPayment;
