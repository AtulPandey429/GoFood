const Joi = require("joi");

const contactSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  location: Joi.string().allow("").optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const linkEmailSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const walletLoginSchema = Joi.object({
  walletAddress: Joi.string().required(),
  walletType: Joi.string().valid("gem", "freighter", "sandbox").required(),
  signature: Joi.string().required(),
  nonce: Joi.string().required(),
  publicKey: Joi.string().optional(),
});

const telegramAuthSchema = Joi.object({
  id: Joi.alternatives().try(Joi.number(), Joi.string()).required(),
  auth_date: Joi.alternatives().try(Joi.number(), Joi.string()).required(),
  hash: Joi.string().required(),
  first_name: Joi.string().optional(),
  last_name: Joi.string().optional(),
  username: Joi.string().optional(),
  photo_url: Joi.string().optional(),
});

const orderSchema = Joi.object({
  order_data: Joi.array().min(1).max(50).required(),
  order_date: Joi.string().optional(),
  paymentMethod: Joi.string().valid("Cash", "Crypto").optional(),
  cryptoAsset: Joi.string().valid("XRP", "XLM", "None").optional(),
  cryptoAmount: Joi.number().min(0).max(1000000).optional(),
  txHash: Joi.string().max(128).allow("").optional(),
  fromAddress: Joi.string().max(128).allow("").optional(),
});

const notificationSchema = Joi.object({
  enableTelegram: Joi.boolean().optional(),
  enableDiscord: Joi.boolean().optional(),
  telegramChatId: Joi.string().allow("").optional(),
  discordWebhookUrl: Joi.string().allow("").optional(),
});

function validate(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }
    next();
  };
}

module.exports = {
  validateContactData: validate(contactSchema),
  validateLoginData: validate(loginSchema),
  validateWalletLogin: validate(walletLoginSchema),
  validateLinkEmail: validate(linkEmailSchema),
  validateLinkWallet: validate(walletLoginSchema),
  validateTelegramAuth: validate(telegramAuthSchema),
  validateOrder: validate(orderSchema),
  validateNotifications: validate(notificationSchema),
};
