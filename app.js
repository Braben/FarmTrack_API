const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const dotenv = require("dotenv");

dotenv.config();
const app = express();

// --- Middlewares ---
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173", // frontend URL
    credentials: true,
  })
);
app.use(helmet());

// --- Logging ---
const { accessLogger, errorLogger } = require("./middlewares/logger");
app.use(accessLogger); // Log all requests
app.use(errorLogger); // Log only 4xx & 5xx

// --- Custom middlewares ---
const { authRateLimit } = require("./middlewares/authmiddleware");

// --- Trust proxy (needed on Render for correct IPs & cookies) ---
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
  console.log("Trust proxy enabled (production mode)");
} else {
  console.log("Running in development mode");
}

// --- Routes ---
const userRoute = require("./routes/userRoutes");
const authRoute = require("./routes/authRoutes");
const farmRoute = require("./routes/farmRoutes");
const recordRoute = require("./routes/recordRoutes");
const salesRoute = require("./routes/salesRoutes");

// Root route
app.get("/", (req, res) => {
  res.send("Welcome to FarmTrack API");
});

// Apply rate limit ONLY to /api/auth
app.use("/api/auth", authRateLimit, authRoute);

// Mount other routes
app.use("/api/users", userRoute);
app.use("/api/farms", farmRoute);
app.use("/api/farms", recordRoute); // nested under farms
app.use("/api/farms", salesRoute); // nested under farms

// --- Global error handler (must be last) ---
app.use((err, req, res, next) => {
  console.error("Global error handler:", err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// --- Start server ---
const PORT = process.env.PORT || 5500;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;
