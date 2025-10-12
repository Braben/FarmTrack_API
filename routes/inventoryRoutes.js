const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/authmiddleware");
const sanitizeBody = require("../middlewares/sanitize");
const {
  listInventory,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  restockInventoryItem,
} = require("../controllers/inventoryController");

router.get("/:farmId/inventory", authMiddleware, listInventory);
router.post(
  "/:farmId/inventory",
  authMiddleware,
  sanitizeBody([
    "itemType",
    "itemName",
    "currentQuantity",
    "unit",
    "unitCost",
    "supplier",
    "purchaseDate",
    "expiryDate",
    "minimumThreshold",
  ]),
  createInventoryItem
);
router.patch(
  "/:farmId/inventory/:itemId",
  authMiddleware,
  sanitizeBody([
    "itemType",
    "itemName",
    "currentQuantity",
    "unit",
    "unitCost",
    "supplier",
    "purchaseDate",
    "expiryDate",
    "minimumThreshold",
  ]),
  updateInventoryItem
);
router.delete(
  "/:farmId/inventory/:itemId",
  authMiddleware,
  deleteInventoryItem
);
router.post(
  "/inventory/:itemId/restock",
  authMiddleware,
  sanitizeBody(["addQuantity", "unitCost"]),
  restockInventoryItem
);

module.exports = router;
