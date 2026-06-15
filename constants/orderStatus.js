const DELIVERY_STATUS = {
  PLACED: "Placed",
  PREPARING: "Preparing",
  DISPATCHED: "Dispatched",
  DELIVERED: "Delivered",
};

const PAYMENT_STATUS = {
  PENDING: "Pending",
  PAID: "Paid",
  FAILED: "Failed",
};

const VALID_TRANSITIONS = {
  Placed: ["Preparing"],
  Preparing: ["Dispatched"],
  Dispatched: ["Delivered"],
  Delivered: [],
};

module.exports = { DELIVERY_STATUS, PAYMENT_STATUS, VALID_TRANSITIONS };
