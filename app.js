const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const dotenv = require("dotenv");
dotenv.config();

const { authRateLimit } = require("./middlewares/authmiddleware");

//import routes
const userRoute = require("./routes/userRoutes"); // User routes: update password
const authRoute = require("./routes/authRoutes"); // Auth routes: register, login, logout, forgot password, reset password etc
const sanitizeBody = require("./middlewares/sanitize");
const farmRoute = require("./routes/farmRoutes"); // Farm routes: create, read, update, delete farms

const app = express();
app.use(helmet());
app.use("/api", authRateLimit); // Apply rate limiting to auth routes
// app.use(
//   sanitizeBody(["firstname", "lastname", "email", "phone", "password", "role"])
// ); // Apply sanitization middleware globally

// Middleware
app.use(cors());
app.use(express.json({ limit: "10kb" })); // Body limit is 10kb
app.use(morgan("dev"));

// Routes
app.get("/", (req, res) => {
  res.send("Welcome to FarmTrack API");
});

// Import routes
app.use("/api/auth", authRoute); // Auth routes
app.use("/api/users", userRoute); // user routes
app.use("/api/farms", farmRoute); // Farm routes

//server listening
app.listen(process.env.PORT || 5500, () => {
  console.log(`Server is running on port ${process.env.PORT || 5500}`);
});

module.exports = app;
