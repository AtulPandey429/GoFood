class FreighterWallet {
  async connect() {
    try {
      const { isConnected, getPublicKey, requestAccess } = await import(
        "@stellar/freighter-api"
      );
      const connected = await isConnected();
      if (!connected) {
        const access = await requestAccess();
        if (!access) throw new Error("Freighter access denied");
      }
      const address = await getPublicKey();
      return { address, walletType: "freighter" };
    } catch (e) {
      throw new Error("Freighter not available: " + e.message);
    }
  }

  async signMessage(message) {
    try {
      const { signMessage } = await import("@stellar/freighter-api");
      const result = await signMessage(message);
      return result.signedMessage || result;
    } catch (e) {
      throw new Error("Freighter sign failed: " + e.message);
    }
  }

  async sendPayment({ to, amount }) {
    return {
      txHash: `xlm_tx_${Date.now()}_${to.slice(0, 8)}`,
      amount,
      asset: "XLM",
    };
  }
}

export default FreighterWallet;
