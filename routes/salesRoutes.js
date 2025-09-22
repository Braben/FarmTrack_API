const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/authmiddleware");
const sanitizeBody = require("../middlewares/sanitize");

const { createSalesRecord } = require("../controllers/salesController");

//define sales routes
router.post(
  "/:farmId/sales",
  authMiddleware,
  sanitizeBody([
    "product",
    "quantity",
    "unitPrice",
    "buyerName",
    "date",
    "notes",
  ]),
  createSalesRecord
);
module.exports = router;
