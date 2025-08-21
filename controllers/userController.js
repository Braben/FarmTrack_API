const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
dotenv.config();
const jwt = require("jsonwebtoken");

// Register user
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

// User login

// exports.signin = async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     const user = await prisma.user.findUnique({
//       where: { email },
//     });

//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     const isPasswordValid = await bcrypt.compare(password, user.password);
//     if (!isPasswordValid) {
//       return res.status(401).json({ error: "Invalid password" });
//     }

//     // Generate a JWT token
//     const accessToken = jwt.sign(
//       { userId: user.id, role: user.role },
//       process.env.JWT_SECRET,
//       {
//         subject: "accessAPI",
//         expiresIn: "1h",
//       }
//     );
//     //check if token is stored in cookies or sent as json response
//     res.cookie("accessToken", accessToken, {
//       httpOnly: true, // Set the cookie as HTTP-only
//       secure: process.env.NODE_ENV === "production", // Set the cookie only in production
//       sameSite: "strict", // Set the cookie to be sent only to the same site to prevent CSRF attacks
//     });

//     // Return the token in the response
//     console.log("User logged in successfully:", user.id);
//     return res.status(200).json({
//       message: "Login successful",
//       accessToken,
//       user: {
//         id: user.id,
//         email: user.email,
//         role: user.role,
//       },
//     });
//   } catch (error) {
//     console.error("Login Error:", error.message);
//     res
//       .status(500)
//       .json({ error: "Login failed", errorMessage: error.message });
//   }
// };

exports.signin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
        lastLogin: true,
        isActive: true, // Check if user is active
        loginAttempts: true,
        lockoutUntil: true,
      },
    });
    const userPassword = user?.user.password || null;
    const isPasswordValid = await bcrypt.compare(password, userPassword);

    // Check if user exists, is active, and password is valid
    if (!user || !user.isActive || !isPasswordValid) {
      // log the failed login attempt
      console.log(`Login failed for user: ${email}`);

      return res
        .status(401)
        .json({ message: "Email or password is incorrect" });
    }

    //check for account lockout
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      return res.status(403).json({
        Error: `Account is locked temporary until ${user.lockoutUntil.toISOString()} due to multiple failed login attempts.`,
      });
    }

    //reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await prisma.user.update({
        where: { email },
        data: {
          loginAttempts: 0,
          lockoutUntil: null, // Reset lockout time
        },
      });
    }

    // Generate a JWT token
    const accessToke = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      {
        subject: user.id.toString(), //subject is the user ID
        expiresIn: "1h",
        issuer: "FarmTrackAPI", // Optional: specify the issuer of the token
        audience: "FarmTrackUsers", // Optional: specify the audience of the token
      }
    );

    // Set the JWT token in a cookie
    res.cookie("accessToken", accessToke, {
      httpOnly: true, // Set the cookie as HTTP-only
      secure: process.env.NODE_ENV === "production", // Set the cookie only in production
      sameSite: "strict", // Set the cookie to be sent only to the same site to prevent CSRF attacks
      maxAge: 7 * 24 * 60 * 60 * 1000, // Set cookie expiration to 7 days
    });
    // Update last login time
    await prisma.user.update({
      where: { email },
      data: {
        lastLogin: new Date(),
      },
    });
    console.log(`User logged in successfully: ${user.id}`);
    // Return the token and user info in the response
    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error logging in:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
//Helper function to handle login attempts
const handleLoginAttempts = async (email) => {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      loginAttempts: true,
      lockoutUntil: true,
    },
  });

  if (user) {
    const attempts = (user.loginAttempts || 0) + 1;
    const lockoutUntil =
      attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null; // Lockout for 15 minutes after 5 failed attempts
    await prisma.user.update({
      where: { email },
      data: {
        loginAttempts: attempts,
        lockoutUntil,
      },
    });
  }
};
