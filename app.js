const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const dotenv = require("dotenv");
dotenv.config();

const { authRateLimit } = require("./middlewares/authmiddleware");
const { accessLogger, errorLogger } = require("./middlewares/logger");

// Import routes
const userRoute = require("./routes/userRoutes");
const authRoute = require("./routes/authRoutes");
const farmRoute = require("./routes/farmRoutes");
const recordRoute = require("./routes/recordRoutes");
const salesRoute = require("./routes/salesRoutes");

const app = express();

// --- Security middlewares ---
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10kb" }));

// --- Logging ---
app.use(accessLogger); // Log all requests
app.use(errorLogger); // Log only 4xx & 5xx

// --- Trust proxy (needed on Render for correct IPs & cookies) ---
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
  console.log("Trust proxy enabled (production mode)");
} else {
  console.log("Running in development mode");
}

// --- Rate limiting (apply only to auth routes like login/register) ---
app.use("/api/auth", authRateLimit);

// --- Routes ---
app.get("/", (req, res) => {
  res.send("Welcome to FarmTrack API");
});

app.use("/api/auth", authRoute); // Auth routes
app.use("/api/users", userRoute); // User routes
app.use("/api/farms", farmRoute); // Farm routes
app.use("/api/farms", recordRoute); // Nested Record routes
app.use("/api/farms", salesRoute); // Sales routes

// --- Global error handler (must be last) ---
app.use((err, req, res, next) => {
  console.error("Global error handler:", err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// --- Start server ---
const PORT = process.env.PORT || 5500;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
