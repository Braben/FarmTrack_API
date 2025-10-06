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

  body("description")
      .optional()
      .isLength({ max: 500 })
      .trim()
      .customSanitizer((val) =>
        sanitizeHtml(val, { allowedTags: [], allowedAttributes: {} })
      ),

    // Records
    body("feedUsedKg")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Feed used must be a non-negative number")
      .toFloat(),

    body("eggsCollected")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Eggs collected must be a non-negative integer"),
    body("birdsDied")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Birds died must be a non-negative integer"),
    body("birdsSold")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Birds sold must be a non-negative integer"),
    body("expenses")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Expenses must be a non-negative number"),
    body("mortialityCause")
      .optional()
      .isLength({ min: 3, max: 100 })
      .trim()
      .customSanitizer((val) => val.toLowerCase()),
    body("photos")
      .optional()
      .isArray()
      .withMessage("Photos must be an array of URLs"),
    body("notes")
      .optional()
      .isLength({ max: 500 })
      .trim()
      .customSanitizer((val) =>
        sanitizeHtml(val, { allowedTags: [], allowedAttributes: {} })
      ),
    body("weatherInfo")
      .optional()
      .isLength({ max: 200 })
      .trim()
      .customSanitizer((val) => val.toLowerCase()),

    // Sales
    body("product")
      .optional()
      .isLength({ min: 1, max: 100 })
      .trim()
      .customSanitizer((val) => val.toLowerCase()),

    body("quantity")
      .optional()
      .isFloat({ gt: 0 })
      .withMessage("Quantity must be a positive number"),

    body("unitPrice")
      .optional()
      .isFloat({ gt: 0 })
      .withMessage("Unit price must be a positive number"),

    body("buyerName")
      .optional()
      .isLength({ min: 3, max: 100 })
      .trim()
      .customSanitizer((val) => val.toLowerCase()),

    // body("date")
    //   .optional()
    //   .isISO8601()
    //   .toDate()
    //   .withMessage("Date must be a valid date"),

    body("notes")
      .optional()
      .isLength({ max: 500 })
      .trim()
      .customSanitizer((val) =>
        sanitizeHtml(val, { allowedTags: [], allowedAttributes: {} })
      ),

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
