const express = require("express");
const app = express();
const cors = require("cors");
const db = require("./Config/db");
const port = process.env.PORT || 3000;

// Connect to the database
db();

// Allow requests from all origins during development
app.use(cors());

// Parse JSON request bodies
app.use(express.json());
app.get("/", (req, res) => {
  res.send("hello");
});
// Use the user route
app.use("/api/user", require("./routers/CreateUser"));
app.use("/api/user", require("./routers/Display"));
// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
