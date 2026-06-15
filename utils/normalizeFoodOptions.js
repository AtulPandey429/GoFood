/**
 * Converts legacy option shapes to [{ label, price }] for the client.
 */
function legacyObjectToOptions(obj, basePrice) {
  const shared = Number(obj.price) || Number(basePrice) || 0;
  return Object.entries(obj)
    .filter(([k]) => k !== "price")
    .map(([, label]) => ({
      label: String(label).charAt(0).toUpperCase() + String(label).slice(1),
      price: shared,
    }));
}

function normalizeFoodItem(item) {
  if (!item?.options) return item;

  const base = Number(item.price) || 0;
  const { options } = item;

  if (Array.isArray(options)) {
    if (options.length === 0) return item;
    const first = options[0];
    if (first?.label != null && first?.price != null) return item;
    if (options.length === 1 && typeof first === "object") {
      return { ...item, options: legacyObjectToOptions(first, base) };
    }
    return item;
  }

  if (typeof options === "object") {
    return { ...item, options: legacyObjectToOptions(options, base) };
  }

  return item;
}

function normalizeFoodItems(items) {
  return (items || []).map(normalizeFoodItem);
}

module.exports = { normalizeFoodItem, normalizeFoodItems };
