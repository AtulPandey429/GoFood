const express = require("express");
const Routes = express.Router();
const { CreateContacts, LoginUser } = require("../controllers/editContact"); // Import controller functions

const { validateContactData } = require("../middleware/validation");

// Route for user signup
Routes.post("/signup", validateContactData, CreateContacts);

// Route for user login
Routes.post("/login", LoginUser);

module.exports = Routes;
