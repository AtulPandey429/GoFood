const express = require("express");
const app = express();
const cors = require("cors");
const db = require("./Config/db");
const port = process.env.PORT || 3000;
const path = require("path");
// Connect to the database
db();

// Allow requests from all origins during development
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Use the user route
app.use("/api/user", require("./routers/CreateUser"));
app.use("/api/user", require("./routers/Display"));
app.use("/api/user", require("./routers/Order"));
app.use(express.static(path.join(__dirname, "./client/build")));
app.get("*", function (req, res) {
  res.sendFile(path.join(__dirname, "./client/build/index.html"));
});
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
