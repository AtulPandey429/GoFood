const { verify, deriveAddress } = require("ripple-keypairs");
const env = require("../../Config/env");
const SandboxAuth = require("./SandboxAuth");

class GemAuth {
  async verifySignature(address, message, signature, publicKey) {
    if (env.SANDBOX_MODE && typeof signature === "string" && signature.startsWith("sandbox_")) {
      return new SandboxAuth().verifySignature(address, message, signature);
    }

    if (!publicKey || !signature || !message || !address) {
      return false;
    }

    try {
      const derived = deriveAddress(publicKey);
      if (derived !== address) {
        console.warn("[GemAuth] public key does not match wallet address");
        return false;
      }
      // Gem Wallet signMessage() signs the nonce as UTF-8 text, not decoded hex bytes.
      const messageHex = Buffer.from(message, "utf8").toString("hex");
      return verify(messageHex, signature, publicKey);
    } catch (e) {
      console.warn("[GemAuth] verify failed:", e.message);
      return false;
    }
  }
}

module.exports = GemAuth;
