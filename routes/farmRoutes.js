const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/authmiddleware");
const sanitizeBody = require("../middlewares/sanitize");
const {
  createFarm,
  getFarms,
  getFarmById,
  updateFarm,
  deleteFarm,
} = require("../controllers/farmController");

// Define farm routes
router.post(
  "/",
  authMiddleware,
  sanitizeBody(["farmName", "location", "size", "farmType", "ownerId"]),
  createFarm
);
router.get("/", authMiddleware, getFarms);
router.get("/:id", authMiddleware, getFarmById);
router.put(
  "/:id",
  authMiddleware,
  sanitizeBody(["farmName", "location", "size", "farmType", "ownerId"]),
  updateFarm
);
router.patch("/:id", authMiddleware, deleteFarm);

// Export the router
module.exports = router;
