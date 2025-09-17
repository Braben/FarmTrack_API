const rateLimit = require("express-rate-limit");

// Define a rate limit for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message:
    "Too many login attempts from this IP, please try again after 15 minutes",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  ipKeyGenerator: (req, res) => {
    // // After enabling trust proxy, req.ip will be the real client IP
    return req.ip;
  }, // Use IP address as the key
  handler: (req, res, next, options) => {
    console.warn(
      `Rate limit exceeded: ${req.ip} tried too many requests on ${req.originalUrl}`
    );
    res.status(options.statusCode).json({ message: options.message });
  },
});
// Apply the rate limit to the login route

module.exports = loginLimiter;

// Define a rate limit for password reset attempts
exports.passwordResetRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Maximum 3 attempts per IP
  message: { message: "Too many password reset attempts, try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});
