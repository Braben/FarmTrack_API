// logger.js
const morgan = require("morgan");
const rfs = require("rotating-file-stream");
const path = require("path");
const fs = require("fs");

// Ensure logs directory exists
const logDirectory = path.join(__dirname, "logs");
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}

// Create rotating write streams
const accessLogStream = rfs.createStream("access.log", {
  interval: "1d", // rotate daily
  path: logDirectory,
});

const errorLogStream = rfs.createStream("error.log", {
  interval: "1d", // rotate daily
  path: logDirectory,
});

// Morgan loggers
let accessLogger;
let errorLogger;

// Log request body (optional, for debugging)
morgan.token("body", (req) => JSON.stringify(req.body || {}));

// Access log: all requests
if (process.env.NODE_ENV === "production") {
  accessLogger = morgan("combined", { stream: accessLogStream });
  errorLogger = morgan("combined", {
    skip: (req, res) => res.statusCode < 400,
    stream: errorLogStream,
  });
  console.log("Morgan logging to ./logs/access.log and ./logs/error.log");
} else {
  accessLogger = morgan("dev");
  errorLogger = morgan("dev", {
    skip: (req, res) => res.statusCode < 400,
  });
  console.log("Morgan 'dev' format enabled (console only)");
}

// --- Global Error Handling ---
// Write errors that crash the app to error.log
process.on("uncaughtException", (err) => {
  const message = `[${new Date().toISOString()}] Uncaught Exception: ${
    err.stack || err
  }`;
  fs.appendFileSync(path.join(logDirectory, "error.log"), message + "\n");
  console.error(message);
  process.exit(1); // Exit so a process manager (PM2, Docker, Render) restarts the app
});

process.on("unhandledRejection", (reason, promise) => {
  const message = `[${new Date().toISOString()}] Unhandled Rejection: ${reason}`;
  fs.appendFileSync(path.join(logDirectory, "error.log"), message + "\n");
  console.error(message);
  // Don’t exit immediately: some prefer graceful shutdown
});

module.exports = {
  accessLogger,
  errorLogger,
};
