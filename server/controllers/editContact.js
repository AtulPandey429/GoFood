const express = require("express");
// const routes = express.Router();
const Contacts = require("../model/Contacts");
const asyncHandler = require("express-async-handler");
const CreateContacts = asyncHandler(async (req, res) => {
  console.log("here are apis", req.body);
  const { name, email, password, location } = req.body;
  if (!name || !email || !password || !location) {
    res.status(400);
    throw new Error("all field are mandatory");
  }
  const createCont = await Contacts.create({
    name,
    email,
    password,
    location,
  });
  res.status(200).json(createCont);
});
const LoginUser = asyncHandler(async (req, res) => {
  const email = req.body.email;

  try {
    let userData = await Contacts.findOne({ email });

    // Check if a user with the provided email exists
    if (!userData) {
      return res.status(400).json({ errors: "Incorrect email " });
    }

    // Compare the provided password with the stored password
    if (req.body.password !== userData.password) {
      return res.status(400).json({ errors: "Incorrect password" });
    }

    // If both email and password match, return a success response
    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = { CreateContacts, LoginUser };
