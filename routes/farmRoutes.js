const express = require("express");
const router = express.Router();
const {
  authMiddleware,
  requireRole,
} = require("../middlewares/authmiddleware");
const sanitizeBody = require("../middlewares/sanitize");
const {
  createFarm,
  getAllFarms,
  getFarmById,
  updateFarm,
  deleteFarm,
} = require("../controllers/farmController");

// Define farm routes
router.post(
  "/",
  authMiddleware,
  sanitizeBody(["farmName", "location", "size", "farmType","description", "ownerId"]),
  createFarm
);
router.get("/", authMiddleware, getAllFarms);
router.get("/:id", authMiddleware, getFarmById);
router.put(
  "/:id",
  authMiddleware,
  sanitizeBody(["farmName", "location", "size", "farmType", "description","ownerId"]),
  updateFarm
);
router.patch("/:id", authMiddleware, deleteFarm);

// Export the router
module.exports = router;
