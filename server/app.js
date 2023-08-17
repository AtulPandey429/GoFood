const express = require("express");
const app = express();
const cors = require("cors");
const db = require("./model/db");
const port = process.env.PORT || 3000;

// Connect to the database
db();

// Allow requests from all origins during development
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Set custom CORS headers
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

// Sample route
app.get("/", (req, res) => {
  res.send("hello");
});

// Use the user route
app.use("/api/user", require("./routers/CreateUser"));

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
