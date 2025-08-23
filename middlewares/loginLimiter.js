const rateLimit = require("express-rate-limit");

// Define a rate limit for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message:
    "Too many login attempts from this IP, please try again after 15 minutes",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
// Apply the rate limit to the login route

module.exports = loginLimiter;

exports.passwordResetRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Maximum 3 attempts per IP
  message: { message: "Too many password reset attempts, try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});
