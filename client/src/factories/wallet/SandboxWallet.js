class SandboxWallet {
  async connect() {
    const address = "rSandbox1234567890abcdefghijklmnop";
    return { address, walletType: "sandbox" };
  }

  async signMessage(message) {
    return `sandbox_${btoa(message)}`;
  }

  async sendPayment({ amount, asset }) {
    return {
      txHash: `sandbox_tx_${Date.now()}_${asset}`,
      amount,
      asset,
    };
  }
}

export default SandboxWallet;
