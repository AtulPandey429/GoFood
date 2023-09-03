const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const db = require("./Config/db");

const app = express();
const port = process.env.PORT || 3000;

// Connect to the database
db();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// API routes
app.use("/api/user", require("./routers/CreateUser"));
app.use("/api/user", require("./routers/Display"));
app.use("/api/user", require("./routers/Order"));

// Serve static files
app.use(express.static(path.join(__dirname, "./client/build")));

// Serve React app for any other routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "./client/build/index.html"));
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
