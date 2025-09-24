const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/authmiddleware");
const sanitizeBody = require("../middlewares/sanitize");

const {
  createSalesRecord,
  getSalesRecords,
  getSalesRecord,
  updateSalesRecord,
  deleteSalesRecord,
} = require("../controllers/salesController");

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
); // Create new sales record

router.get("/:farmId/sales", authMiddleware, getSalesRecords); // Get all sales records for a farm

router.get("/:farmId/sales/:id", authMiddleware, getSalesRecord); // Get single sales record by ID

router.patch(
  "/:farmId/sales/:id",
  authMiddleware,
  sanitizeBody([
    "product",
    "quantity",
    "unitPrice",
    "buyerName",
    "date",
    "notes",
  ]),
  updateSalesRecord
); // Update sales record by ID

router.delete("/:farmId/sales/:id", authMiddleware, deleteSalesRecord); // Delete sales record by ID

module.exports = router;
