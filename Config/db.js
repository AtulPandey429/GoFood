const DatabaseFactory = require("../factories/database/DatabaseFactory");

const mongodb = async () => {
  await DatabaseFactory.initialize();
};

module.exports = mongodb;
