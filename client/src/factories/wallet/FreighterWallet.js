class FreighterWallet {
  async connect() {
    const { isConnected, requestAccess } = await import("@stellar/freighter-api");

    const installed = await isConnected();
    if (!installed) {
      throw new Error("Freighter extension not installed — get it at freighter.app");
    }

    const address = await requestAccess();
    if (!address) {
      throw new Error("Freighter access denied");
    }

    return { address, walletType: "freighter" };
  }

  async signMessage(message) {
    const { signMessage } = await import("@stellar/freighter-api");
    const result = await signMessage(message);
    if (result?.error) {
      throw new Error(result.error.message || "Freighter sign failed");
    }
    return result.signedMessage || result;
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
