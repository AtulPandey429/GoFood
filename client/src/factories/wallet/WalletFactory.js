import GemWallet from "./GemWallet";
import FreighterWallet from "./FreighterWallet";

const WalletFactory = {
  create(type) {
    switch (type) {
      case "gem":
        return new GemWallet();
      case "freighter":
        return new FreighterWallet();
      default:
        throw new Error(`Unknown wallet type: ${type}`);
    }
  },
};

export default WalletFactory;
