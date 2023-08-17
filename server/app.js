const express = require("express");
const app = express();
const db = require("./model/db"); // Corrected the path to the db.js file
db();
app.use(express.json());
app.get("/", (req, res) => {
  res.send("hello");
});
app.use("/api/user", require("./routers/CreateUser")); // Corrected the path to the CreateUser.js file

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
