const sanitizeHtml = require("sanitize-html");
const { body, validationResult } = require("express-validator");
const validator = require("validator");
const { parsePhoneNumberFromString } = require("libphonenumber-js");

/**
 * Middleware factory for sanitizing & validating request bodies, queries, and params.
 * @param {string[]} allowedFields - Whitelisted body fields to keep.
 */
const sanitizeBody = (allowedFields = []) => {
  return [
    // --- Step 1: Validation rules for body ---
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
        const phoneNumber = parsePhoneNumberFromString(value, "GH");
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

    // Farms
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

    // --- Step 2: Sanitization middleware for body, query & params ---
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

      // Helper sanitize function
      const cleanValue = (val, key = "") => {
        if (typeof val !== "string") return val;

        let cleaned = sanitizeHtml(val, {
          allowedTags: [],
          allowedAttributes: {},
        }).trim();

        if (key.toLowerCase() === "email") {
          cleaned = validator.normalizeEmail(cleaned) || cleaned;
        }

        if (key.toLowerCase() === "phone") {
          const phoneNumber = parsePhoneNumberFromString(cleaned, "GH");
          if (phoneNumber && phoneNumber.isValid()) {
            cleaned = phoneNumber.number; // E.164 format: +233501234567
          }
        }

        return cleaned;
      };

      // Sanitize body (only whitelisted fields)
      const sanitizedBody = {};
      for (const [key, value] of Object.entries(req.body)) {
        if (allowedFields.length && !allowedFields.includes(key)) continue;
        sanitizedBody[key] = cleanValue(value, key);
      }
      req.body = sanitizedBody;

      // Sanitize query params
      for (const [key, value] of Object.entries(req.query)) {
        req.query[key] = cleanValue(value, key);
      }

      // Sanitize route params (like :id, :farmId)
      for (const [key, value] of Object.entries(req.params)) {
        req.params[key] = cleanValue(value, key);
      }

      next();
    },
  ];
};

module.exports = sanitizeBody;
