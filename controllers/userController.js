const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
dotenv.config();

exports.register = async (req, res) => {
  try {
    const { firstname, lastname, email, phone, password, role, profileInfo } =
      req.body;

    // const existingUser = await prisma.user.findUnique({
    //   where: { email, OR: { phone } },
    // });

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: email }, { phone: phone }],
      },
    });
    // if (existingUser)
    //   return res.status(400).json({ error: "Email or phone already registered" });
    if (existingUser) {
      let reason = "Email or phone already registered";

      if (existingUser.email === email && existingUser.phone === phone) {
        reason = "Email and phone already registered";
      } else if (existingUser.email === email) {
        reason = "Email already registered";
      } else if (existingUser.phone === phone) {
        reason = "Phone already registered";
      }

      return res.status(400).json({ error: reason });
    }
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        firstname,
        lastname,
        email,
        phone,
        password: hashedPassword,
        role,
        profileInfo,
      },
    });

    console.log("New User Created:", newUser);
    res.status(201).json({
      message: "User registered successfully",
      // newUser: { newUser, id: newUser.id, email: newUser.email },
      newUser,
    });
  } catch (error) {
    console.error("Registration Erro:", error.message);
    res
      .status(500)
      .json({ error: "Registration failed", errorMessage: error.message });
  }
};

// Get all users
exports.getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.status(200).json(users);
    console.log("Users retrieved successfully");
  } catch (error) {
    console.error("Error retrieving users:", error.message);
    res.status(500).json({ error: "Failed to retrieve users" });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id }, // id is a String (cuid)
      //   select: {
      //     id: true,
      //     firstname: true,
      //     lastname: true,
      //     email: true,
      //     phone: true,
      //     role: true,
      //   },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    return res.status(200).json({
      success: true,
      message: "User retrieved successfully",
      data: user,
    });
  } catch (error) {
    console.error("Error retrieving user:", error.message);
    return res.status(500).json({
      success: false,
      error: "Failed to retrieve user",
    });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { firstname, lastname, email, phone, role } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        firstname,
        lastname,
        email,
        phone,
        role,
      },
    });
    res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });
    console.log("User updated successfully:", updatedUser);
  } catch (error) {
    console.error("Error updating user:", error.message);
    res.status(500).json({ error: "Failed to update user" });
  }
};

//delete user
exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await prisma.user.delete({
      where: { id },
    });
    res.status(200).json({
      message: "User deleted successfully",
      DeletedUser: user.id ? user.id : "No ID found",
    });
    console.log("User deleted successfully:", user.id);
  } catch (error) {
    console.error("Error deleting user:", error.message);
    res.status(500).json({ error: "Failed to delete user" });
  }
};
