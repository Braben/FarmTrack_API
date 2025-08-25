const express = require("express");
const router = express.Router();

// Import user controller
const {
  register,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  login,
  logout,
  // requestPasswordReset,
  // resetPassword,
  forgotPassword,
  resetPassword,
} = require("../controllers/userController");
const loginLimiter = require("../middlewares/loginLimiter");

// Define user routes
router.post("/register", register);
router.get("/", getUsers);
router.get("/:id", getUserById);
router.put("/update/:id", updateUser);
router.delete("/:id", deleteUser);

//Define auth routes
router.post("/login", loginLimiter, login); // Note: The login route is protected by the loginLimiter middleware to prevent brute force attacks
router.post("/logout", logout); // Logout route
// Password reset routes
// router.post("/request-password-reset", requestPasswordReset); // Request password reset
// // Note: The password reset route is not rate-limited here, but you can add a rate limiter if needed
// router.post("/reset-password", resetPassword); // Reset password route (not implemented in this snippet)

router.post("/forgot-password", forgotPassword); // Forgot password route
router.patch("/reset-password/:token", resetPassword); // Reset password route

// Export the router
module.exports = router;
