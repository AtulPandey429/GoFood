const mongoose = require("mongoose");
const dotenv = require("dotenv").config();
const mongoUrl = process.env.URL;

const mongodb = async () => {
  try {
    await mongoose.connect(mongoUrl, { useNewUrlParser: true });
    // console.log("db connected");

    const fetched_data = await mongoose.connection.db.collection("food_items");
    const data = await fetched_data.find({}).toArray();
    global.food_items = data;
    const food_Cdata = await mongoose.connection.db.collection("food_category");
    const Cdata = await food_Cdata.find({}).toArray();
    global.foodCategory = Cdata;
  } catch (error) {
    console.log("Error connecting to the database:", error.message);
  }
};

module.exports = mongodb;
