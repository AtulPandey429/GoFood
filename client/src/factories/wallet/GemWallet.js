import { ensureGemInstalled, unwrapGemResponse } from "../../utils/gemWalletResponse";

class GemWallet {
  async connect() {
    const { isInstalled, getAddress, getPublicKey } = await import("@gemwallet/api");

    await ensureGemInstalled(isInstalled);

    const addressResponse = await getAddress();
    const address = unwrapGemResponse(addressResponse, "address");

    const keyResponse = await getPublicKey();
    const publicKey = unwrapGemResponse(keyResponse, "publicKey");
    const keyAddress = keyResponse.result?.address;
    if (keyAddress && keyAddress !== address) {
      throw new Error("Gem Wallet address mismatch — try reconnecting");
    }

    return { address, publicKey, walletType: "gem" };
  }

  async signMessage(message) {
    const { signMessage } = await import("@gemwallet/api");
    const response = await signMessage(message);
    return unwrapGemResponse(response, "signedMessage");
  }

  async sendPayment({ to, amount }) {
    const { sendPayment } = await import("@gemwallet/api");
    const drops = Math.round(Number(amount) * 1_000_000);
    const response = await sendPayment({
      destination: to,
      amount: String(drops),
    });
    const hash = unwrapGemResponse(response, "hash");
    return { txHash: hash, amount, asset: "XRP" };
  }
}

export default GemWallet;
