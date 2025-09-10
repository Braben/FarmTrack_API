const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
dotenv.config();
const jwt = require("jsonwebtoken");

// Register user

// update password function
exports.updatePassword = async (req, res) => {
  // Ensure user is authenticated
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // 1. Get user from DB
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }, // ✅ FIXED here
      select: { password: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return res.status(404).json({ error: "User not found or inactive" });
    }

    // 2. Check if current password matches
    const isPasswordValid = await bcrypt.compare(
      req.body.currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    if (req.body.currentPassword === req.body.newPassword) {
      return res.status(400).json({
        error: "New password must be different from current password",
      });
    }

    // 3. Check new password confirmation
    if (req.body.newPassword !== req.body.confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    // 4. Hash new password & update in DB
    const hashedPassword = await bcrypt.hash(req.body.newPassword, 10);

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        password: hashedPassword,
        passwordChangedAt: new Date(),
      },
    });

    // 5. Generate new JWT
    const accessToken = jwt.sign(
      { userId: req.user.id, role: req.user.role }, // optional role
      process.env.JWT_SECRET,
      {
        subject: req.user.id.toString(),
        expiresIn: "1h",
        issuer: "FarmTrackAPI",
        audience: "FarmTrackUsers",
      }
    );

    // 6. Set JWT in cookie
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 1000, // 1h
    });

    // 7. Final response
    console.log(`User logged in with new password: ${req.user.id}`);
    return res.status(200).json({
      message: "Password updated and user logged in successfully",
      token: accessToken,
    });
  } catch (error) {
    console.error("Error updating password:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// exports.updateMe = async (req, res) => {
//   // Ensure user is authenticated
//   if (!req.user || !req.user.id) {
//     return res.status(401).json({ error: "Unauthorized", statusCode: 401 });
//   }
//   // const { id } = req.params;
//   // const { firstname, lastname, email, phone, role } = req.body;

//   // if (req.body.password || req.body.passwordConfirm) {
//   //   return res.status(400).json({
//   //     error: "This route is not for password updates.",
//   //     statusCode: 400,
//   //   });
//   // }
//   try {
//     const updatedUser = await prisma.user.findFirst({
//       where: { id: req.user.id },
//       data: {
//         firstname: req.body.name,
//         lastname: req.body.lastname,
//         email: req.body.email,
//         phone: req.body.phone,

//         // Add other fields as necessary
//       },
//       select: {
//         id: true,
//         firstname: true,
//         lastname: true,
//         email: true,
//         phone: true,
//         role: true,
//       },
//     });

//     res
//       .status(200)
//       .json({ user: updatedUser, message: "User updated successfully" });
//   } catch (error) {
//     console.error("Error updating user:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };

exports.updateMe = async (req, res) => {
  // Ensure user is authenticated
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: "Unauthorized", statusCode: 401 });
  }
  try {
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        email: req.body.email,
        phone: req.body.phone,
        // Add other fields as necessary
      },
      select: {
        id: true,
        firstname: true,
        lastname: true,
        email: true,
        phone: true,
        role: true,
      },
    });
    res
      .status(200)
      .json({ user: updatedUser, message: "User updated successfully" });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.deleteMe = async (req, res) => {
  // Ensure user is authenticated
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: "Unauthorized", statusCode: 401 });
  }
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { isActive: false }, // Soft delete by setting isActive to false
    });
    res.status(204).json({ message: "User deleted successfully", data });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
