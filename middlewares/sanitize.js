const sanitizeHtml = require("sanitize-html");
const { body, validationResult } = require("express-validator");
const validator = require("validator");
const { parsePhoneNumberFromString } = require("libphonenumber-js");

const sanitizeBody = (allowedFields = []) => {
  return [
    // --- Step 1: Validation + Sanitization rules ---
    body("firstname")
      .optional()
      .isLength({ min: 3, max: 50 })
      .trim()
      .customSanitizer((val) => val.toLowerCase()),

    body("lastname")
      .optional()
      .isLength({ min: 3, max: 50 })
      .trim()
      .customSanitizer((val) => val.toLowerCase()),

    body("email")
      .optional()
      .isEmail()
      .withMessage("Invalid email format")
      .normalizeEmail(),

    body("phone")
      .optional()
      .custom((value) => {
        const phoneNumber = parsePhoneNumberFromString(value, "GH"); // Ghana default
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
        "Password must be at least 8 characters, with upper, lower, number & symbol."
      ),

    body("farmName")
      .optional()
      .isLength({ min: 3, max: 100 })
      .trim()
      .customSanitizer((val) => val.toLowerCase()),

    body("location")
      .optional()
      .isLength({ min: 3, max: 100 })
      .trim()
      .customSanitizer((val) => val.toLowerCase()),

    body("size")
      .optional()
      .isFloat({ gt: 0 })
      .withMessage("Size must be a positive number"),

    body("farmType")
      .optional()
      .isLength({ min: 3, max: 50 })
      .trim()
      .customSanitizer((val) => val.toLowerCase()),

    body("ownerId")
      .optional()
      .isString()
      .withMessage("Owner ID must be a string"),

    // --- Step 2: Sanitization middleware ---
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "fail",
          errors: errors.array().map((err) => ({
            field: err.param,
            message: err.msg,
          })),
        });
      }

      const sanitized = {};
      for (const [key, value] of Object.entries(req.body)) {
        if (allowedFields.length && !allowedFields.includes(key)) continue;

        if (typeof value === "string") {
          let cleaned = sanitizeHtml(value, {
            allowedTags: [],
            allowedAttributes: {},
          });

          // Prevent basic SQL injection attempts
          if (
            /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE)\b)/i.test(
              cleaned
            )
          ) {
            return res.status(400).json({
              status: "fail",
              error: `Invalid characters detected in field "${key}"`,
            });
          }

          // Normalize email
          if (key.toLowerCase() === "email") {
            cleaned = validator.normalizeEmail(cleaned) || cleaned;
          }

          // Normalize phone
          if (key.toLowerCase() === "phone") {
            const phoneNumber = parsePhoneNumberFromString(cleaned, "GH");
            if (phoneNumber && phoneNumber.isValid()) {
              cleaned = phoneNumber.number; // E.164 format: +233501234567
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
