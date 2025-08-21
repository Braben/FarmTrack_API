const express = require("express");
const router = express.Router();

// Import user controller
const {
  register,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  signin,
} = require("../controllers/userController");

// Define user routes
router.post("/register", register);
router.get("/", getUsers);
router.get("/:id", getUserById);
router.put("/update/:id", updateUser);
router.delete("/:id", deleteUser);

//Define auth routes
router.post("/login", signin);

// Export the router
module.exports = router;
