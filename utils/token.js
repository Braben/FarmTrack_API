const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

// Generate Access Token
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    {
      subject: user.id.toString(),
      expiresIn: process.env.JWT_ACCESSTOKEN_EXPIRES_IN || "15m",
      issuer: "FarmTrack",
      audience: "FarmTrackUsers",
    } // Access token valid for 15 minutes
  );
};

// Generate Refresh Token
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: process.env.JWT_REFRESHTOKEN_EXPIRES_IN || "7d",
      issuer: "FarmTrack",
      audience: "FarmTrackUsers",
    } // Refresh token valid for 7 days
  );
};

// Verify Access Token
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET, {
      issuer: "FarmTrack",
      audience: "FarmTrackUsers",
    });
  } catch (err) {
    return null;
  }
};

// Verify Refresh Token
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
      issuer: "FarmTrack",
      audience: "FarmTrackUsers",
    });
  } catch (err) {
    return null;
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
