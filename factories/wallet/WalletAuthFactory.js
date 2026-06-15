const GemAuth = require("./GemAuth");
const FreighterAuth = require("./FreighterAuth");
const SandboxAuth = require("./SandboxAuth");
const { WALLET_TYPES } = require("../../constants/walletTypes");

const WalletAuthFactory = {
  create(type) {
    switch (type) {
      case WALLET_TYPES.GEM:
        return new GemAuth();
      case WALLET_TYPES.FREIGHTER:
        return new FreighterAuth();
      case WALLET_TYPES.SANDBOX:
        return new SandboxAuth();
      default:
        throw new Error(`Unknown wallet type: ${type}`);
    }
  },
};

module.exports = WalletAuthFactory;
