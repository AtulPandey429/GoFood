const express = require("express");
const routes = express.Router();
const Contacts = require("../model/Contacts");

// routes.post('/createuser', async (req, res) => {
//     try {
//         await User.create({
//             name:req.body.name,
//             email:req.body.email,
//             password:req.body.password,
//             location:req.body.location,

//         });

//         res.json({success:true });
//     } catch (error) {
//         console.log(error.message);
//         res.json({success:false });
//     }
// });
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

module.exports = { CreateContacts };
