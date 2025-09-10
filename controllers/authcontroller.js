const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
dotenv.config();
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendEmail } = require("../utils/email");
const e = require("express");

// This function handles user registration
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
      select: {
        id: true,
        firstname: true,
        lastname: true,
        email: true,
        phone: true,
        role: true,
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

// User login function
// This function handles user login
exports.login = async (req, res) => {
  const { emailOrPhone, password } = req.body;

  try {
    // Single database query to get user
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: emailOrPhone }, { phone: emailOrPhone }],
      },
      select: {
        id: true,
        email: true,
        phone: true,
        password: true,
        role: true,
        lastLogin: true,
        isActive: true,
        loginAttempts: true,
        lockoutUntil: true,
      },
    });

    // Always check password to prevent timing attacks
    const isPasswordValid = user
      ? await bcrypt.compare(password, user.password)
      : await bcrypt.compare(
          password,
          "$2b$10$dummy.hash.to.prevent.timing.attacks"
        );

    // Check if user exists and password is valid
    if (!user || !isPasswordValid || !emailOrPhone) {
      if (user) {
        await handleLoginAttempts(user.id); // Use ID as consistent identifier
      }
      console.log(`Login failed for identifier: ${emailOrPhone}`);
      return res
        .status(401)
        .json({ message: "Email/phone or password is incorrect" });
    }

    // Check if account is active
    if (!user.isActive) {
      return res
        .status(403)
        .json({ message: "Account is deactivated. Contact admin." });
    }

    // Check for account lockout
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      return res.status(403).json({
        message: `Account is locked until ${user.lockoutUntil.toISOString()} due to multiple failed login attempts.`,
      });
    }

    // Reset login attempts and update last login in single transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: 0,
          lockoutUntil: null,
          lastLogin: new Date(),
        },
      }),
    ]);

    // Generate JWT token with consistent expiration
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      {
        subject: user.id.toString(),
        expiresIn: "1h",
        issuer: "FarmTrackAPI",
        audience: "FarmTrackUsers",
      }
    );

    // Set cookie with same expiration as token
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 1000, // 1 hour to match JWT expiration
    });

    console.log(`User logged in successfully: ${user.id}`);

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        accessToken: accessToken, // return token in response too
      },
    });
  } catch (error) {
    console.error("Error logging in:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

//helper function to handle login attempts
// This function increments the login attempts and sets a lockout time if necessary
const handleLoginAttempts = async (userId) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        loginAttempts: true,
      },
    });

    if (user) {
      const attempts = (user.loginAttempts || 0) + 1; // Increment login attempts
      const lockoutUntil =
        attempts >= 5 ? new Date(Date.now() + 10 * 60 * 1000) : null; // Lockout for 10 minutes after 5 failed attempts

      await prisma.user.update({
        where: { id: userId },
        data: {
          loginAttempts: attempts,
          lockoutUntil,
        },
      });
    }
  } catch (error) {
    console.error("Error handling login attempts:", error);
    // Don't throw - login should still fail gracefully
  }
};

//logout user function
exports.logout = async (req, res) => {
  try {
    // Clear the cookie by setting its maxAge to 0
    res.cookie("accessToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0, // Set maxAge to 0 to clear the cookie
    });

    return res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Error during logout:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// reset password function
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // 1. Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        isActive: true,
        // Check for recent reset attempts to prevent spam
        passwordResetExpires: true,
      },
    });

    // Always return the same response to prevent email enumeration
    const standardResponse = {
      message:
        "If an account with that email exists and is active, a password reset link has been sent.",
    };

    // Only proceed if user exists and is active
    if (user && user.isActive) {
      // Prevent multiple reset requests within short time

      // 2. Generate reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const passwordResetToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");
      const passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      try {
        // 3. Update user with reset token
        await prisma.user.update({
          where: { id: user.id },
          data: {
            passwordResetToken,
            passwordResetExpires,
          },
        });

        // 4. Prepare email content
        const resetURL = `${req.protocol}://${req.get(
          "host"
        )}/api/users/reset-password/${resetToken}`;

        const emailContent = {
          email: user.email,
          subject: "Password Reset Request - Action Required",
          message: `
Hello,

You have requested a password reset for your account. Click the link below to reset your password:

${resetURL}

This link will expire in 10 minutes for security reasons.

If you did not request this password reset, please ignore this email and your password will remain unchanged.

For security reasons, please do not share this link with anyone.

Best regards,
FarmTrack Team
          `.trim(),
        };

        // 5. Send email
        await sendEmail(emailContent);

        console.log(
          `Password reset email sent successfully to user: ${user.email}`
        );

        // For development/testing only - remove in production
        console.log(`Reset token for testing: ${resetToken}`);
      } catch (emailError) {
        console.error("Error sending password reset email:", emailError);

        // Clean up the reset token if email failed
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              passwordResetToken: null,
              passwordResetExpires: null,
            },
          });
        } catch (cleanupError) {
          console.error("Error cleaning up reset token:", cleanupError);
        }

        // Don't reveal email sending failure to prevent enumeration
        // Log the error but return standard response
        return res.status(200).json(standardResponse);
      }
    } else {
      // Log attempt for non-existent or inactive users
      console.log(
        `Password reset attempted for invalid/inactive email: ${email}`
      );
    }

    // Always return the same response
    return res.status(200).json(standardResponse);
  } catch (error) {
    console.error("Error in forgot password:", error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

//reset password function
exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  if (!token) {
    return res.status(400).json({ error: "Invalid or missing token" });
  }

  try {
    // 1. Hash the token
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // 2. Find user with matching token and valid expiration
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ error: "Token is invalid or has expired" });
    }

    // 3. Validate password
    // if (!newPassword || newPassword.length < 8) {
    //   return res
    //     .status(400)
    //     .json({ error: "Password must be at least 8 characters long" });
    // }

    // 4. Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 5. Update user with new password & clear reset fields
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        passwordChangedAt: new Date(),
      },
    });

    // 6. Generate JWT token for auto-login
    const accessToken = jwt.sign(
      { userId: updatedUser.id, role: updatedUser.role },
      process.env.JWT_SECRET,
      {
        subject: updatedUser.id.toString(),
        expiresIn: "1h",
        issuer: "FarmTrackAPI",
        audience: "FarmTrackUsers",
      }
    );

    // 7. Set cookie (optional, if you’re using cookies for auth)
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // 8. Send response
    return res.status(200).json({
      message: "Password has been reset successfully. You are now logged in.",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
      },
      token: accessToken, // return token in response too
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    return res.status(500).json({ error: "Failed to reset password" });
  }
};
