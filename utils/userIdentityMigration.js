/**
 * Removes fake @wallet.local emails and backfills order userId / customerWallet.
 */
const { hasRealEmail } = require("./userIdentity");

async function migrateUserIdentity() {
  const mongoose = require("mongoose");
  if (mongoose.connection.readyState !== 1) return;

  const User = require("../model/User");
  const Order = require("../model/Order");

  const placeholderUsers = await User.find({
    email: { $regex: /@wallet\.local$/i },
  }).lean();

  for (const user of placeholderUsers) {
    const legacyEmail = user.email;
    await User.updateOne({ _id: user._id }, { $unset: { email: "" } });
    if (user.walletAddress) {
      await Order.updateMany(
        { userEmail: legacyEmail },
        {
          $set: {
            userId: user._id,
            userEmail: "",
            customerWallet: user.walletAddress,
          },
        }
      );
    }
  }

  if (placeholderUsers.length > 0) {
    console.log(`[db] Cleared placeholder email on ${placeholderUsers.length} wallet user(s)`);
  }

  const walletUsers = await User.find({ walletAddress: { $exists: true, $ne: "" } }).lean();
  for (const user of walletUsers) {
    await Order.updateMany(
      { customerWallet: user.walletAddress, userId: { $exists: false } },
      { $set: { userId: user._id } }
    );
    if (hasRealEmail(user)) {
      await Order.updateMany(
        { userId: user._id },
        { $set: { userEmail: user.email } }
      );
    }
  }
}

module.exports = { migrateUserIdentity };
