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
  refreshToken,
  resetPassword,
} = require("../controllers/authcontroller");
const loginLimiter = require("../middlewares/loginLimiter");
const { authMiddleware } = require("../middlewares/authmiddleware");
const sanitizeBody = require("../middlewares/sanitize");

// Define user routes
router.post(
  "/register",
  sanitizeBody(["firstname", "lastname", "email", "phone", "password", "role"]),
  register
); // Register route
router.get("/:id", getUserById);
router.put(
  "/update/:id",
  authMiddleware,
  sanitizeBody(["firstname", "lastname", "email", "phone", "password", "role"]),
  updateUser
);
router.delete("/:id", deleteUser);

//Define auth routes
router.post("/login", loginLimiter, login); // Note: The login route is protected by the loginLimiter middleware to prevent brute force attacks
router.post("/refresh-token", refreshToken); // Refresh token route
router.post("/logout", authMiddleware, logout); // Logout route
router.post("/refresh-token", refreshToken);

// Password reset routes
router.post("/forgot-password", forgotPassword); // Forgot password route
router.patch("/reset-password/:token", resetPassword); // Reset password route

// Export the router
module.exports = router;
