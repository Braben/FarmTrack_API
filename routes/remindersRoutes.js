const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/authmiddleware");
const sanitizeBody = require("../middlewares/sanitize");
const {
  createReminder,
  getReminders,
  updateReminder,
  deleteReminder,
} = require("../controllers/remindersController");

// Create reminder
router.post(
  "/:farmId/reminders",
  authMiddleware,
  sanitizeBody(["title", "description", "date", "time"]),
  createReminder
);

// List reminders for a farm
router.get("/:farmId/reminders", authMiddleware, getReminders);

// Update reminder
router.patch(
  "/:farmId/reminders/:reminderId",
  authMiddleware,
  sanitizeBody(["title", "description", "date", "time"]),
  updateReminder
);

// Delete reminder
router.delete("/:farmId/reminders/:reminderId", authMiddleware, deleteReminder);

module.exports = router;
