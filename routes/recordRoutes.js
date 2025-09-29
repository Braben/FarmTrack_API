const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/authmiddleware");
const sanitizeBody = require("../middlewares/sanitize");
const {
  createRecord,
  getAllRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
} = require("../controllers/recordController");

// Create new record
router.post(
  "/:farmId/records",
  authMiddleware,
  sanitizeBody([
    "feedUsedKg",
    "eggsCollected",
    "birdsDied",
    "birdsSold",
    "expenses",
    "mortialityCause",
    "photos",
    "notes",
    "weatherInfo",
  ]),
  createRecord
);

// Get all records for a farm
router.get("/:farmId/records", authMiddleware, getAllRecords);

// Get single record
router.get("/:farmId/records/:recordId", authMiddleware, getRecordById);

// Update record
router.put(
  "/:farmId/records/:recordId",
  authMiddleware,
  sanitizeBody([
    "feedUsedKg",
    "eggsCollected",
    "birdsDied",
    "birdsSold",
    "expenses",
    "mortialityCause",
    "photos",
    "notes",
    "weatherInfo",
  ]),
  updateRecord
);

// Delete record
router.delete("/:farmId/records/:recordId", authMiddleware, deleteRecord);

module.exports = router;
