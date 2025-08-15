const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
dotenv.config();

exports.register = async (req, res) => {
  try {
    const { firstname, lastname, email, phone, password, role } = req.body;

    const existingUser = await prisma.User.findUnique({ where: { email } });
    if (existingUser)
      return res.status(400).json({ error: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        firstname,
        lastname,
        email,
        phone,
        password: hashedPassword,
        role,
      },
    });

    res.status(201).json({
      message: "User registered successfully",
      user: { id: user.id, email: user.email },
    });
    console.log(
      `User registered: ${user.email} with role ${user.role} successfully`
    );
  } catch (error) {
    res.status(500).json({ error: "Registration failed" });
  }
};
