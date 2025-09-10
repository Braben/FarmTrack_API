const express = require("express");
const router = express.Router();

const {
  register,
  getUserById,
  updateUser,
  deleteUser,
  login,
  logout,
  forgotPassword,
  resetPassword,
} = require("../controllers/authcontroller");
const loginLimiter = require("../middlewares/loginLimiter");
const { authMiddleware } = require("../middlewares/authmiddleware");

// Define user routes
router.post("/register", register);
router.get("/:id", getUserById);
router.put("/update/:id", authMiddleware, updateUser);
router.delete("/:id", deleteUser);

//Define auth routes
router.post("/login", loginLimiter, login); // Note: The login route is protected by the loginLimiter middleware to prevent brute force attacks
router.post("/logout", authMiddleware, logout); // Logout route

// Password reset routes
router.post("/forgot-password", forgotPassword); // Forgot password route
router.patch("/reset-password/:token", resetPassword); // Reset password route

// Export the router
module.exports = router;
