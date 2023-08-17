const mongoose = require("mongoose");
const dotenv = require("dotenv").config();
const mongoUrl = process.env.URL;

const mongodb = async () => {
  try {
    await mongoose.connect(mongoUrl);
    console.log("db connected");
  } catch (error) {
    console.log("Error connecting to the database:", error.message);
  }
};

module.exports = mongodb;
