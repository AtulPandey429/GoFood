const mongoose = require("mongoose");
const dotenv = require("dotenv").config();
const mongoUrl = process.env.URL;

const mongodb = async () => {
  try {
    await mongoose.connect(mongoUrl);
    console.log("db connected");
    const fetched_data = await mongoose.connection.db.collection("food_items");
    fetched_data.find({}).toArray((err, data) => {
      if (err) {
        console.log(err);
      } else {
        global.food_items = data;
        console.log(global.food_items);
      }
    });
  } catch (error) {
    console.log("Error connecting to the database:", error.message);
  }
};

module.exports = mongodb;
