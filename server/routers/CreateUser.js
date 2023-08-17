// const express = require("express");
// const Routes = express.Router();
// // const CreateContacts = require("../controllers/editContact");

// Routes.post("/", require("../controllers/editContact"));

// module.exports = Routes;

const express = require("express");
const Routes = express.Router();
const { CreateContacts } = require("../controllers/editContact"); // Import the CreateContacts function

const { validateContactData } = require("../middleware/validation");

Routes.use(validateContactData);
Routes.post("/", CreateContacts); // Use the CreateContacts function as the callback

module.exports = Routes;
