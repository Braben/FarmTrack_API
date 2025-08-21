const express = require("express");
const router = express.Router();

// Import user controller
const {
  register,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require("../controllers/userController");

// Define routes
router.post("/register", register);
router.get("/", getUsers);
router.get("/:id", getUserById);
router.put("/update/:id", updateUser);
router.delete("/:id", deleteUser);

// Export the router
module.exports = router;
