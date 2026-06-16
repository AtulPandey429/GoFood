const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const {
  validateContactData,
  validateLoginData,
  validateWalletLogin,
  validateLinkWallet,
  validateLinkEmail,
  validateTelegramAuth,
} = require("../middleware/validation");

router.get("/providers", authController.authProviders);
router.post("/signup", validateContactData, authController.signup);
router.post("/login", validateLoginData, authController.login);
router.get("/wallet-challenge", authController.walletChallenge);
router.post("/wallet-login", validateWalletLogin, authController.walletLogin);
router.post("/link-wallet", authMiddleware, validateLinkWallet, authController.linkWallet);
router.post("/link-email", authMiddleware, validateLinkEmail, authController.linkEmail);
router.post("/telegram-login", validateTelegramAuth, authController.telegramLogin);
router.post("/telegram-link", authMiddleware, validateTelegramAuth, authController.telegramLink);
router.post("/telegram-bot-link/start", authMiddleware, authController.telegramBotLinkStart);
router.get("/telegram-bot-link/status/:token", authMiddleware, authController.telegramBotLinkStatus);
router.get("/discord/start", authController.discordLoginStart);
router.get("/discord/link/start", authMiddleware, authController.discordLinkStart);
router.get("/discord/callback", authController.discordCallback);
router.get("/me", authMiddleware, authController.me);

module.exports = router;
