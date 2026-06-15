const asyncHandler = require("express-async-handler");
const authService = require("../services/authService");
const discordAuthService = require("../services/discordAuthService");

exports.signup = asyncHandler(async (req, res) => {
  const user = await authService.registerUser(req.body);
  res.status(200).json({ success: true, user });
});

exports.login = asyncHandler(async (req, res) => {
  try {
    const { token, user } = await authService.loginWithCredentials(req.body);
    res.json({ success: true, authToken: token, user });
  } catch (e) {
    e.statusCode = 400;
    throw e;
  }
});

exports.walletChallenge = asyncHandler(async (req, res) => {
  const challenge = authService.issueWalletChallenge();
  res.json({ success: true, ...challenge });
});

exports.walletLogin = asyncHandler(async (req, res) => {
  const { token, user } = await authService.verifyWalletLogin(req.body);
  res.json({ success: true, authToken: token, user });
});

exports.authProviders = asyncHandler(async (req, res) => {
  const providers = authService.getAuthProviders();
  const env = require("../Config/env");
  res.json({
    success: true,
    ...providers,
    telegramLoginDomain: env.TELEGRAM_LOGIN_DOMAIN || null,
    telegramSetupNote:
      "BotFather /setdomain does not accept localhost. Use ngrok (ngrok http 3001) and set the ngrok hostname as the domain.",
  });
});

exports.telegramLogin = asyncHandler(async (req, res) => {
  const { token, user } = await authService.loginWithTelegram(req.body);
  res.json({ success: true, authToken: token, user });
});

exports.telegramLink = asyncHandler(async (req, res) => {
  const user = await authService.linkTelegramToUser(req.user.id, req.body);
  res.json({ success: true, user, message: "Telegram account linked" });
});

exports.telegramBotLinkStart = asyncHandler(async (req, res) => {
  const telegramBotService = require("../services/telegramBotService");
  const pollToken = telegramBotService.createLinkToken(req.user.id);
  res.json({
    success: true,
    pollToken,
    botUrl: telegramBotService.getBotDeepLink(pollToken),
  });
});

exports.telegramBotLinkStatus = asyncHandler(async (req, res) => {
  const telegramBotService = require("../services/telegramBotService");
  const result = telegramBotService.getLinkResult(req.params.token);
  res.json({ success: true, ...result });
});

exports.discordLoginStart = asyncHandler(async (req, res) => {
  const url = authService.getDiscordLoginUrl();
  res.json({ success: true, url });
});

exports.discordLinkStart = asyncHandler(async (req, res) => {
  const url = authService.getDiscordLinkUrl(req.user.id);
  res.json({ success: true, url });
});

exports.discordCallback = asyncHandler(async (req, res) => {
  const { code, state, error } = req.query;
  const clientBase = discordAuthService.getClientRedirect();

  if (error || !code || !state) {
    return res.redirect(`${clientBase}/login?error=discord_denied`);
  }

  try {
    const result = await authService.handleDiscordCallback(code, state);
    if (result.mode === "link") {
      return res.redirect(`${clientBase}/notifications?linked=discord`);
    }
    const token = encodeURIComponent(result.token);
    return res.redirect(`${clientBase}/auth/callback?token=${token}`);
  } catch (e) {
    const msg = encodeURIComponent(e.message || "Discord login failed");
    return res.redirect(`${clientBase}/login?error=${msg}`);
  }
});

exports.me = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user.id);
  res.json({ success: true, user });
});
