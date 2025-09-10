const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/authmiddleware");

// Import user controller
const {
  getAllUsers,
  updatePassword,
  updateMe,
  deleteMe,
} = require("../controllers/userController");

// Define user routes
router.get("/allusers", getAllUsers); // Get all users route

router.patch("/updatepassword", authMiddleware, updatePassword); // Change password route
router.patch("/updateme", authMiddleware, updateMe); // updateuser(ME) route
router.patch("/deleteme", authMiddleware, deleteMe); // deleteuser(ME) route

module.exports = router;
