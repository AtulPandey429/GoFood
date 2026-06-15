/**
 * Normalizes food option data from API/DB into size choices with numeric prices.
 * Supports:
 * - [{ label: "Full", price: 299 }, { label: "Half", price: 169 }]
 * - [{ half: "Full", quarter: "Half", price: 299 }]
 * - { half: "Full", quarter: "Half", price: 299 }
 */
export function parseFoodOptions(options, basePrice = 0) {
  const fallback = Number(basePrice) || 0;

  if (Array.isArray(options)) {
    if (options.length === 0) {
      return defaultSize(fallback);
    }

    const first = options[0];
    if (first?.label != null && first?.price != null) {
      const sizes = options.map((o, i) => ({
        key: String(i),
        label: String(o.label),
        price: Number(o.price) || fallback,
      }));
      return { sizes, defaultKey: sizes[0].key };
    }

    if (options.length === 1 && typeof first === "object") {
      return parseFoodOptions(first, basePrice);
    }
  }

  if (options && typeof options === "object") {
    const sharedPrice = Number(options.price) || fallback;
    const sizes = Object.entries(options)
      .filter(([k]) => k !== "price")
      .map(([key, label]) => ({
        key,
        label: String(label),
        price: sharedPrice,
      }));

    if (sizes.length > 0) {
      return { sizes, defaultKey: sizes[0].key };
    }
  }

  return defaultSize(fallback);
}

function defaultSize(price) {
  return {
    sizes: [{ key: "default", label: "Regular", price }],
    defaultKey: "default",
  };
}

export function getUnitPrice(sizes, selectedKey) {
  const found = sizes.find((s) => s.key === selectedKey);
  const price = found?.price ?? sizes[0]?.price ?? 0;
  return Number.isFinite(price) ? price : 0;
}

export function calcLineTotal(qty, unitPrice) {
  const q = Number(qty) || 1;
  const p = Number(unitPrice) || 0;
  return q * p;
}
