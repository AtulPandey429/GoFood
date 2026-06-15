import { unwrapGemResponse, ensureGemInstalled } from "../gemWalletResponse";

describe("gemWalletResponse", () => {
  test("unwrapGemResponse extracts field from v3 response", () => {
    const value = unwrapGemResponse(
      { type: "response", result: { address: "rTest123", publicKey: "ED123" } },
      "address"
    );
    expect(value).toBe("rTest123");
  });

  test("unwrapGemResponse throws on reject", () => {
    expect(() => unwrapGemResponse({ type: "reject" }, "address")).toThrow(/rejected/i);
  });

  test("ensureGemInstalled throws when extension missing", async () => {
    await expect(
      ensureGemInstalled(() => Promise.resolve({ result: { isInstalled: false } }))
    ).rejects.toThrow(/not installed/i);
  });
});
