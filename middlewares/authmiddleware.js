const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const rateLimit = require("express-rate-limit");
const { verifyAccessToken } = require("../utils/token");

// In-memory cache for user data
const userCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Rate limiting for login/register/refresh routes
const authRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { message: "Too many authentication requests, try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Get user from cache or DB
const getUserWithCache = async (userId) => {
  const cacheKey = `user_${userId}`;
  const cached = userCache.get(cacheKey);

  // Return cached if valid
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.user;
  }

  // Fetch from DB
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      refreshToken: true,
    },
  });

  // Update cache
  if (user) {
    userCache.set(cacheKey, { user, timestamp: Date.now() });
  } else {
    userCache.delete(cacheKey);
  }

  return user;
};

// Clear cache when user data change (e.g. on role change, deactivate)
const clearUserCache = (userId) => {
  userCache.delete(`user_${userId}`);
};

// Main authentication middleware
exports.authMiddleware = async (req, res, next) => {
  try {
    let token = null;

    // check Authorization Header: Extract Bearer token from header
    const authHeader = req.headers["authorization"];
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    // Fallback: check cookies
    if (!token && req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    //if no token, reject
    if (!token) {
      return res.status(401).json({
        message: "Access denied. Authentication token required.",
      });
    }

    // Verify token using our token.js helper from utils/token.js
    const decoded = verifyAccessToken(token);

    // If token invalid/expired
    if (!decoded) {
      return res.status(401).json({
        message: "Invalid or expired token. Please log in again.",
        code: "TOKEN_INVALID",
      });
    }

    // Extract userId from token payload
    const userId = decoded.id || decoded.userId || decoded.sub; // matches token.js payload structure
    if (!userId) {
      return res.status(401).json({
        message: "Invalid token payload.",
        code: "INVALID_PAYLOAD",
      });
    }

    // Get user (cached or DB)
    const user = await getUserWithCache(userId);

    if (!user) {
      return res.status(403).json({
        message: "User account not found.",
        code: "USER_NOT_FOUND",
      });
    }

    // If user is deactivated
    if (!user.isActive) {
      return res.status(403).json({
        message: "User account is deactivated. Contact admin.",
        code: "ACCOUNT_DEACTIVATED",
      });
    }

    // Attach user + token info
    // req.user = user;
    // req.token = decoded;

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    };
    req.token = decoded;

    console.log(
      `✅ Auth success: User ${user.id} (${user.role}) from ${req.ip}`
    );
    next();
  } catch (error) {
    console.error("Authentication Middleware error:", error);
    return res.status(500).json({ message: "Internal authentication error." });
  }
};

// Role-based authorization
exports.requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const userRole = req.user.role;
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!roles.includes(userRole)) {
      return res.status(403).json({
        message: "Forbidden: You do not have access to this resource",
        requiredRoles: roles,
        currentRole: userRole,
      });
    }

    next();
  };
};

// Optional: Require token refresh if too old
exports.requireFreshToken = (maxAge = 30 * 60) => {
  return (req, res, next) => {
    if (!req.token) {
      return res.status(401).json({ message: "Token missing" });
    }

    const tokenAge = Date.now() / 1000 - req.token.iat;
    if (tokenAge > maxAge) {
      return res.status(401).json({
        message: "Token too old. Please refresh session.",
        code: "TOKEN_TOO_OLD",
      });
    }

    next();
  };
};

// Utilities
exports.invalidateUserCache = clearUserCache;
exports.authRateLimit = authRateLimit;
exports.cleanupCache = () => {
  const now = Date.now();
  for (const [key, value] of userCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      userCache.delete(key);
    }
  }
};
