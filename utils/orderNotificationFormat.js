function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatDecimal(value, places = 2) {
  const n = Number(value);
  if (!Number.isFinite(n)) return (0).toFixed(places);
  return n.toFixed(places);
}

function lineItemLabel(item) {
  const name = item.name || "Item";
  const option = item.size || item.options || item.option || "";
  const qty = item.qty || 1;
  const unit = Number(item.price) || 0;
  const lineTotal = unit * qty;
  const optionPart = option ? ` (${option})` : "";
  return `• ${escapeHtml(name)}${escapeHtml(optionPart)} × ${qty} — ₹${lineTotal}`;
}

function formatOrderDetails(order) {
  const meta = order?.metadata || order || {};
  const items = Array.isArray(order?.items) ? order.items : [];
  const lines = [];

  let totalInr = 0;
  items.forEach((item) => {
    lines.push(lineItemLabel(item));
    totalInr += (Number(item.price) || 0) * (item.qty || 1);
  });

  if (!items.length) {
    lines.push("• (no line items recorded)");
  }

  lines.push("");
  lines.push(`<b>Total:</b> ₹${formatDecimal(totalInr)}`);

  const payment = meta.paymentMethod || "Cash";
  const crypto =
    meta.cryptoAsset && meta.cryptoAsset !== "None"
      ? ` · ${formatDecimal(meta.cryptoAmount)} ${meta.cryptoAsset}`
      : "";
  lines.push(`<b>Payment:</b> ${escapeHtml(payment)}${crypto}`);

  const delivery = meta.deliveryStatus || "Placed";
  const payStatus = meta.paymentStatus || "Pending";
  lines.push(`<b>Delivery:</b> ${escapeHtml(delivery)}`);
  if (meta.verificationNote && payStatus === "Pending") {
    lines.push(
      `<b>Payment status:</b> ${escapeHtml(payStatus)} (${escapeHtml(meta.verificationNote)})`
    );
  } else {
    lines.push(`<b>Payment status:</b> ${escapeHtml(payStatus)}`);
  }

  if (meta.Order_date) {
    lines.push(`<b>Date:</b> ${escapeHtml(meta.Order_date)}`);
  }

  const ref = order?.orderId || meta.orderId;
  if (ref) {
    lines.push(`<b>Ref:</b> #${escapeHtml(String(ref).slice(0, 8))}`);
  }

  return lines.join("\n");
}

const EVENT_LABELS = {
  order_placed: "Order placed",
  payment_confirmed: "Payment confirmed",
  status_preparing: "Order preparing",
  status_dispatched: "Order dispatched",
  status_delivered: "Order delivered",
  status_update: "Order update",
  test: "Test notification",
};

function formatOrderNotification({ event, order }) {
  const title = EVENT_LABELS[event] || event;
  const details = formatOrderDetails(order);
  return `<b>GoFood</b> — ${escapeHtml(title)}\n\n${details}`;
}

module.exports = {
  formatOrderDetails,
  formatOrderNotification,
  EVENT_LABELS,
};
