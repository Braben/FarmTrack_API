const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const dotenv = require("dotenv");
dotenv.config();

//import routes
const userRoutes = require("./routes/userRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use(helmet());

// Routes
app.get("/", (req, res) => {
  res.send("Welcome to FarmTrack API");
});

// Import routes
app.use("/api/users", userRoutes);

//server listening
app.listen(process.env.PORT || 5500, () => {
  console.log(`Server is running on port ${process.env.PORT || 5500}`);
});

module.exports = app;
