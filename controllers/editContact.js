const express = require("express");
// const routes = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../model/User");
const asyncHandler = require("express-async-handler");
const CreateContacts = asyncHandler(async (req, res) => {
  console.log("here are apis", req.body);
  const salt = await bcrypt.genSalt(10);
  const securePassword = await bcrypt.hash(req.body.password, salt);

  const { name, email, password, location } = req.body;
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Name, email, and password are required");
  }
  const createCont = await User.create({
    name,
    email,
    password: securePassword,
    location: location || "",
  });
  res.status(200).json(createCont);
});
const LoginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  try {
    const userData = await User.findOne({ email });

    if (!userData) {
      return res.status(400).json({ errors: "Incorrect email or password" });
    }

    // Compare the provided password with the stored plain-text password
    const passwordBcrypt = await bcrypt.compare(
      req.body.password,
      userData.password
    );
    if (!passwordBcrypt) {
      return res.status(400).json({ errors: "Incorrect email or password" });
    }
    const data = {
      user: {
        id: userData.id,
      },
    };
    const authToken = jwt.sign(data, process.env.ACCESS_TOKEN_SECRET);

    // If both email and password match, return a success response
    return res.json({ success: true, message: "Login successful", authToken });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, error: "Login failed" });
  }
});

module.exports = { CreateContacts, LoginUser };
