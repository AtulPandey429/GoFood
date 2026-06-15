/**
 * @gemwallet/api v3 wraps every call as { type: "response"|"reject", result?: object }
 */
export function unwrapGemResponse(response, field) {
  if (!response) {
    throw new Error("No response from Gem Wallet");
  }
  if (response.type === "reject") {
    throw new Error("Request rejected in Gem Wallet");
  }
  const value = field ? response.result?.[field] : response.result;
  if (value == null || value === "") {
    throw new Error("Gem Wallet returned no data — approve the popup to continue");
  }
  return value;
}

export async function ensureGemInstalled(isInstalled) {
  const response = await isInstalled();
  if (response?.result?.isInstalled !== true) {
    throw new Error(
      "Gem Wallet extension is not installed. Get it at https://gemwallet.app"
    );
  }
}
