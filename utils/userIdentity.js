const PLACEHOLDER_EMAIL_RE = /@(wallet|telegram|discord)\.local$/i;

function isPlaceholderEmail(email) {
  return !email || PLACEHOLDER_EMAIL_RE.test(String(email));
}

function hasRealEmail(user) {
  return Boolean(user?.email) && !isPlaceholderEmail(user.email);
}

function getDisplayIdentity(userOrOrder) {
  if (!userOrOrder) return "";
  const email = userOrOrder.email || userOrOrder.userEmail;
  if (email && !isPlaceholderEmail(email)) return email;
  if (userOrOrder.walletAddress) return userOrOrder.walletAddress;
  if (userOrOrder.customerWallet) return userOrOrder.customerWallet;
  return userOrOrder.name || "User";
}

module.exports = { isPlaceholderEmail, hasRealEmail, getDisplayIdentity };
