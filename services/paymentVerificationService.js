const env = require("../Config/env");
const { isSandboxAllowed, validateTxHash } = require("../utils/securityValidators");
const { PAYMENT_STATUS } = require("../constants/orderStatus");

const XRPL_TX_RETRIES = 8;
const XRPL_TX_RETRY_DELAY_MS = 2500;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function normalizeTxHash(hash) {
  return String(hash || "")
    .trim()
    .replace(/^0x/i, "")
    .toUpperCase();
}

function normalizeXrpAddress(address) {
  return String(address || "").trim();
}

function dropsToXrp(drops) {
  if (drops == null) return 0;
  const raw = typeof drops === "object" ? drops.value : String(drops);
  return Number(raw) / 1_000_000;
}

function extractPaymentAmount(meta, tx) {
  const amount = tx.Amount ?? meta.Amount;
  if (typeof amount === "string") return amount;
  if (amount?.value != null) return amount.value;
  const delivered = meta.delivered_amount ?? meta.DeliveredAmount ?? tx.DeliverMax;
  if (typeof delivered === "string") return delivered;
  if (delivered?.value != null) return delivered.value;
  return null;
}

function getXrplServerUrls() {
  const primary = env.XRPL_HTTP_URL;
  if (env.CRYPTO_NETWORK === "testnet") {
    return [
      ...new Set([
        primary,
        "https://testnet.xrpl-labs.com/",
        "https://s.altnet.rippletest.net:51234/",
      ]),
    ];
  }
  return [primary, "https://xrplcluster.com/"].filter((v, i, a) => a.indexOf(v) === i);
}

async function xrplRequest(method, params, serverUrl = env.XRPL_HTTP_URL) {
  const res = await fetch(serverUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ method, params: [params] }),
  });
  if (!res.ok) throw new Error(`XRPL HTTP ${res.status}`);
  const data = await res.json();
  if (data.result?.status === "error" || data.result?.error) {
    const err = new Error(data.result.error_message || data.result.error || "XRPL error");
    err.code = data.result.error;
    throw err;
  }
  return data.result;
}

async function fetchXrpTransaction(txHash) {
  const hash = normalizeTxHash(txHash);
  const servers = getXrplServerUrls();
  let lastError;

  for (let attempt = 0; attempt < XRPL_TX_RETRIES; attempt++) {
    const serverUrl = servers[attempt % servers.length];
    try {
      const meta = await xrplRequest("tx", { transaction: hash, binary: false }, serverUrl);
      if (meta.validated === false) {
        lastError = new Error("Transaction not yet validated on ledger");
        if (attempt < XRPL_TX_RETRIES - 1) {
          console.log(
            `[paymentVerify:XRP] waiting for validation (${attempt + 1}/${XRPL_TX_RETRIES})`
          );
          await sleep(XRPL_TX_RETRY_DELAY_MS);
          continue;
        }
        throw lastError;
      }
      return meta;
    } catch (e) {
      lastError = e;
      const retryable =
        e.code === "txnNotFound" ||
        /not found/i.test(e.message) ||
        /not yet validated/i.test(e.message);

      if (retryable && attempt < XRPL_TX_RETRIES - 1) {
        console.log(
          `[paymentVerify:XRP] ${env.CRYPTO_NETWORK} @ ${serverUrl} — ${e.message} — retry ${attempt + 1}/${XRPL_TX_RETRIES}`
        );
        await sleep(XRPL_TX_RETRY_DELAY_MS);
        continue;
      }
      throw e;
    }
  }

  throw lastError || new Error("Transaction not found on XRPL");
}

const paymentVerificationService = {
  async verify({ txHash, cryptoAsset, cryptoAmount, fromAddress }) {
    const normalizedHash = normalizeTxHash(txHash);
    const formatCheck = validateTxHash(normalizedHash, cryptoAsset);
    if (!formatCheck.valid) {
      return { verified: false, reason: formatCheck.message };
    }

    if (formatCheck.sandbox) {
      if (!isSandboxAllowed()) {
        return { verified: false, reason: "Sandbox payments disabled" };
      }
      return {
        verified: true,
        sandbox: true,
        paymentStatus: PAYMENT_STATUS.PAID,
        verifiedAt: new Date().toISOString(),
        fromAddress: fromAddress || "sandbox",
        toAddress: "sandbox",
      };
    }

    if (cryptoAsset === "XRP") {
      return this._verifyXrp({
        txHash: normalizedHash,
        cryptoAmount,
        fromAddress,
      });
    }
    if (cryptoAsset === "XLM") {
      return this._verifyXlm({ txHash: normalizedHash, cryptoAmount, fromAddress });
    }

    return { verified: false, reason: "Unsupported asset" };
  },

  async _verifyXrp({ txHash, cryptoAmount, fromAddress }) {
    const merchantAddress = normalizeXrpAddress(env.MERCHANT_XRP_ADDRESS);
    if (!merchantAddress) {
      return { verified: false, reason: "Merchant XRP address not configured in .env" };
    }

    try {
      const meta = await fetchXrpTransaction(txHash);
      const tx = meta.tx_json || meta;

      if (tx.TransactionType !== "Payment") {
        return { verified: false, reason: "Not a payment transaction" };
      }

      const destination = normalizeXrpAddress(tx.Destination);
      const amountDrops = extractPaymentAmount(meta, tx);
      if (amountDrops == null) {
        return { verified: false, reason: "Could not read payment amount from transaction" };
      }

      const amountXrp = parseFloat(dropsToXrp(amountDrops));
      if (!Number.isFinite(amountXrp) || amountXrp <= 0) {
        return { verified: false, reason: "Invalid on-chain payment amount" };
      }

      if (destination !== merchantAddress) {
        return {
          verified: false,
          reason: `Payment sent to ${destination.slice(0, 12)}… but merchant is ${merchantAddress.slice(0, 12)}… — check MERCHANT_XRP_ADDRESS in .env`,
        };
      }

      const tolerance = Math.max(Number(cryptoAmount) * 0.02, 0.01);
      if (Math.abs(amountXrp - Number(cryptoAmount)) > tolerance) {
        return {
          verified: false,
          reason: `Payment amount mismatch (sent ${amountXrp.toFixed(2)} XRP, expected ${Number(cryptoAmount).toFixed(2)} XRP)`,
        };
      }

      if (
        fromAddress &&
        tx.Account &&
        normalizeXrpAddress(tx.Account) !== normalizeXrpAddress(fromAddress)
      ) {
        console.warn(
          `[paymentVerify:XRP] sender note: client=${fromAddress} chain=${tx.Account}`
        );
      }

      return {
        verified: true,
        sandbox: false,
        paymentStatus: PAYMENT_STATUS.PAID,
        verifiedAt: new Date().toISOString(),
        fromAddress: tx.Account,
        toAddress: destination,
        ledgerIndex: meta.ledger_index,
        amountOnChain: amountXrp,
      };
    } catch (e) {
      console.warn("[paymentVerify:XRP]", txHash, e.message);
      const reason =
        e.code === "txnNotFound" || /not found/i.test(e.message)
          ? `Transaction not found on XRPL ${env.CRYPTO_NETWORK} — set CRYPTO_NETWORK=testnet in .env if Gem uses testnet (current: ${env.CRYPTO_NETWORK})`
          : e.message || "Could not verify XRP transaction";
      return { verified: false, reason };
    }
  },

  async _verifyXlm({ txHash, cryptoAmount, fromAddress }) {
    if (!env.MERCHANT_XLM_ADDRESS) {
      return { verified: false, reason: "Merchant XLM address not configured" };
    }

    try {
      const res = await fetch(`${env.STELLAR_HORIZON_URL}/transactions/${txHash}`);
      if (!res.ok) return { verified: false, reason: "Transaction not found on Stellar" };

      const tx = await res.json();
      if (!tx.successful) {
        return { verified: false, reason: "Stellar transaction failed" };
      }

      const opsRes = await fetch(`${env.STELLAR_HORIZON_URL}/transactions/${txHash}/operations`);
      const opsData = await opsRes.json();
      const paymentOp = (opsData._embedded?.records || []).find((op) => op.type === "payment");

      if (!paymentOp) {
        return { verified: false, reason: "No payment operation found" };
      }

      if (paymentOp.to !== env.MERCHANT_XLM_ADDRESS) {
        return { verified: false, reason: "Payment sent to wrong address" };
      }

      const amountXlm = parseFloat(paymentOp.amount);
      const tolerance = Math.max(cryptoAmount * 0.02, 0.000001);
      if (Math.abs(amountXlm - cryptoAmount) > tolerance) {
        return { verified: false, reason: "Payment amount mismatch" };
      }

      if (fromAddress && paymentOp.from !== fromAddress) {
        return { verified: false, reason: "Sender address mismatch" };
      }

      return {
        verified: true,
        sandbox: false,
        paymentStatus: PAYMENT_STATUS.PAID,
        verifiedAt: new Date().toISOString(),
        fromAddress: paymentOp.from,
        toAddress: paymentOp.to,
        ledgerIndex: tx.ledger,
        amountOnChain: amountXlm,
      };
    } catch (e) {
      console.warn("[paymentVerify:XLM]", e.message);
      return { verified: false, reason: e.message || "Could not verify XLM transaction" };
    }
  },
};

module.exports = paymentVerificationService;
