import GemWallet from "./GemWallet";
import FreighterWallet from "./FreighterWallet";
import SandboxWallet from "./SandboxWallet";

const WalletFactory = {
  create(type) {
    switch (type) {
      case "gem":
        return new GemWallet();
      case "freighter":
        return new FreighterWallet();
      case "sandbox":
      default:
        return new SandboxWallet();
    }
  },
};

export default WalletFactory;
