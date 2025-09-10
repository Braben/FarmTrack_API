const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const dotenv = require("dotenv");
dotenv.config();

//import routes
const userRoute = require("./routes/userRoutes"); // User routes: update password
const authRoute = require("./routes/authRoutes"); // Auth routes: register, login, logout, forgot password, reset password etc

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
app.use("/api/auth", authRoute); // Auth routes
app.use("/api/users", userRoute); // user routes

//server listening
app.listen(process.env.PORT || 5500, () => {
  console.log(`Server is running on port ${process.env.PORT || 5500}`);
});

module.exports = app;
