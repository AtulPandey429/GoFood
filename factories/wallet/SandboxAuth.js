const env = require("../../Config/env");

class SandboxAuth {
  async verifySignature(address, message, signature) {
    if (!env.SANDBOX_MODE) return false;
    return Boolean(address && message && signature);
  }
}

module.exports = SandboxAuth;
