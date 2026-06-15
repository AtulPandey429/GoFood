const env = require("../../Config/env");
const SandboxAuth = require("./SandboxAuth");

class FreighterAuth {
  async verifySignature(address, message, signature) {
    if (env.SANDBOX_MODE && signature.startsWith("sandbox_")) {
      return new SandboxAuth().verifySignature(address, message, signature);
    }
    try {
      const StellarBase = require("@stellar/stellar-base");
      const keypair = StellarBase.Keypair.fromPublicKey(address);
      return keypair.verify(
        Buffer.from(message),
        Buffer.from(signature, "base64")
      );
    } catch (e) {
      console.warn("[FreighterAuth] verify failed:", e.message);
      return false;
    }
  }
}

module.exports = FreighterAuth;
