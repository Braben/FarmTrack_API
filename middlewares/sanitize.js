const sanitizeHtml = require("sanitize-html");
const { body, validationResult } = require("express-validator");
const validator = require("validator");
const { parsePhoneNumberFromString } = require("libphonenumber-js");

/**
 * Middleware factory for sanitizing & validating request bodies.
 * @param {string[]} allowedFields - Whitelisted fields to keep in the body.
 */
const sanitizeBody = (allowedFields = []) => {
  return [
    // --- Step 1: Validation rules ---
    body("firstname")
      .optional()
      .isLength({ min: 3, max: 50 })
      .withMessage("Firstname must be between 1 and 50 characters"),

    body("lastname")
      .optional()
      .isLength({ min: 3, max: 50 })
      .withMessage("Lastname must be between 1 and 50 characters"),

    body("email")
      .optional()
      .isEmail()
      .withMessage("Invalid email format")
      .normalizeEmail(),

    body("phone")
      .optional()
      .custom((value) => {
        const phoneNumber = parsePhoneNumberFromString(value, "GH"); // Default country GH (Ghana)
        if (!phoneNumber || !phoneNumber.isValid()) {
          throw new Error("Invalid phone number");
        }
        return true;
      }),

    body("password")
      .optional()
      .isStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      })
      .withMessage(
        "Password is not strong enough: It should be at least 8 characters long and include uppercase, lowercase, number, and symbol."
      ),

    // --- Step 2: Sanitization middleware ---
    (req, res, next) => {
      // Validation error handling
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const sanitized = {};
      for (const [key, value] of Object.entries(req.body)) {
        // Only keep allowed fields
        if (allowedFields.length && !allowedFields.includes(key)) continue;

        if (typeof value === "string") {
          let cleaned = value.trim();

          // Prevent XSS/JS injection
          cleaned = sanitizeHtml(cleaned, {
            allowedTags: [],
            allowedAttributes: {},
          });

          // Normalize email
          if (key.toLowerCase() === "email") {
            cleaned = validator.normalizeEmail(cleaned) || cleaned;
          }

          // Normalize phone
          if (key.toLowerCase() === "phone") {
            const phoneNumber = parsePhoneNumberFromString(cleaned, "GH");
            if (phoneNumber && phoneNumber.isValid()) {
              cleaned = phoneNumber.number; // e.g. +233501234567
            }
          }

          sanitized[key] = cleaned;
        } else {
          sanitized[key] = value;
        }
      }

      req.body = sanitized;
      next();
    },
  ];
};

module.exports = sanitizeBody;

// app.post(
//   "/register",
//   sanitizeBody(["firstname", "lastname", "email", "phone", "password", "role"]),
//   async (req, res) => {
//     console.log("Sanitized body:", req.body);
//     res.json({ sanitizedBody: req.body });
//   }
// );
