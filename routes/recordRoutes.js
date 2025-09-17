const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/authmiddleware");
const sanitizeBody = require("../middlewares/sanitize");
const {
  createRecord,
  getFarmRecords,
  getRecord,
  updateRecord,
  deleteRecord,
} = require("../controllers/recordController");

// Create new record
router.post(
  "/:farmId",
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
router.get("/:farmId", authMiddleware, getFarmRecords);

// Get single record
router.get("/:id", authMiddleware, getRecord);

// Update record
router.patch(
  "/:id",
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
router.delete("/:id", authMiddleware, deleteRecord);

module.exports = router;
