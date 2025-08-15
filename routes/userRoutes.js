const express = require("express");
const router = express.Router();

// Import user controller
const { register } = require("../controllers/userController");

router.post("/register", register);

module.exports = router;
