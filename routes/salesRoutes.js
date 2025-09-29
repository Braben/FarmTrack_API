const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/authmiddleware");
const sanitizeBody = require("../middlewares/sanitize");

const {
  createSale,
  getSales,
  getSaleById,
  updateSale,
  deleteSale,
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
  createSale
); // Create new sales record

router.get("/:farmId/sales", authMiddleware, getSales); // Get all sales records for a farm

router.get("/:farmId/sales/:saleId", authMiddleware, getSaleById); // Get single sales record by ID

router.patch(
  "/:farmId/sales/:saleId",
  authMiddleware,
  sanitizeBody([
    "product",
    "quantity",
    "unitPrice",
    "buyerName",
    "date",
    "notes",
  ]),
  updateSale
); // Update sales record by ID

router.delete("/:farmId/sales/:saleId", authMiddleware, deleteSale); // Delete sales record by ID

module.exports = router;
