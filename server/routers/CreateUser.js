// const express = require("express");
// const Routes = express.Router();
// // const CreateContacts = require("../controllers/editContact");

// Routes.post("/", require("../controllers/editContact"));

// module.exports = Routes;

const express = require("express");
const Routes = express.Router();
const { CreateContacts, LoginUser } = require("../controllers/editContact"); // Import the CreateContacts function

const { validateContactData } = require("../middleware/validation");
const { validateLoginData } = require("../middleware/LoginValidation");

Routes.post("/signup", validateContactData, CreateContacts);
// Use the CreateContacts function as the callback
Routes.post("/login", LoginUser);

module.exports = Routes;
