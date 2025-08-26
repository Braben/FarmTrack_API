// const { PrismaClient } = require("@prisma/client");
// const prisma = new PrismaClient();
// const jwt = require("jsonwebtoken");

// exports.authMiddleware = async (req, res, next) => {
//   const token = req.header("Authorization")?.replace("Bearer ", "");

//   if (!token) {
//     return res.status(401).json({ error: "Access denied. No token provided." });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     // Re-fetch user from DB to get fresh info
//     const user = await prisma.user.findUnique({
//       where: { id: decoded.userId },
//       select: { id: true, email: true, role: true, isActive: true },
//     });

//     if (!user || !user.isActive) {
//       return res
//         .status(403)
//         .json({ error: "User is not active or does not exist." });
//     }

//     req.user = user; // Attach user info
//     next();
//   } catch (err) {
//     if (err.name === "TokenExpiredError") {
//       return res
//         .status(401)
//         .json({ error: "Token has expired. Please log in again." });
//     }
//     return res.status(401).json({ error: "Invalid token." });
//   }
// };

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");

// In-memory cache for user data to reduce DB queries
const userCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Rate limiting for authentication attempts
const authRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100, // Maximum 100 requests per IP
  message: { message: "Too many authentication requests, try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Helper function to get user from cache or database
const getUserWithCache = async (userId) => {
  const cacheKey = `user_${userId}`;
  const cached = userCache.get(cacheKey);

  // Check if cached data is still valid
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.user;
  }

  // Fetch from database
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      // Add tokenVersion if you implement token invalidation
      // tokenVersion: true
    },
  });

  // Cache the result
  if (user) {
    userCache.set(cacheKey, {
      user,
      timestamp: Date.now(),
    });
  } else {
    // Remove from cache if user no longer exists
    userCache.delete(cacheKey);
  }

  return user;
};

// Helper function to clear user cache
const clearUserCache = (userId) => {
  userCache.delete(`user_${userId}`);
};

// Main authentication middleware
exports.authMiddleware = async (req, res, next) => {
  try {
    // Extract token from various possible locations
    let token = null;

    // Check Authorization header (Bearer token)
    const authHeader = req.header("Authorization");
    if (authHeader) {
      const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
      if (bearerMatch) {
        token = bearerMatch[1];
      }
    }

    // Fallback: Check cookies (if you're using cookie-based auth)
    if (!token && req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    // No token found
    if (!token) {
      console.log(`Authentication failed: No token provided from IP ${req.ip}`);
      return res.status(401).json({
        message: "Access denied. Authentication token required.",
      });
    }

    // Basic token format validation
    if (token.length < 10 || token.length > 500) {
      console.log(
        `Authentication failed: Invalid token format from IP ${req.ip}`
      );
      return res.status(401).json({
        message: "Invalid token format.",
      });
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === "TokenExpiredError") {
        console.log(
          `Authentication failed: Token expired for user ${jwtError.payload?.userId} from IP ${req.ip}`
        );
        return res.status(401).json({
          message: "Token has expired. Please log in again.",
          code: "TOKEN_EXPIRED",
        });
      }

      if (jwtError.name === "JsonWebTokenError") {
        console.log(`Authentication failed: Invalid token from IP ${req.ip}`);
        return res.status(401).json({
          message: "Invalid token.",
          code: "INVALID_TOKEN",
        });
      }

      console.log(
        `Authentication failed: JWT verification error from IP ${req.ip}:`,
        jwtError.message
      );
      return res.status(401).json({
        message: "Token verification failed.",
        code: "TOKEN_VERIFICATION_FAILED",
      });
    }

    // Validate token payload
    const userId = decoded.userId || decoded.id; // Support both userId and sub claims
    // if (!decoded.userId || typeof decoded.userId !== "string") {
    //   console.log(
    //     `Authentication failed: Invalid token payload from IP ${req.ip}`
    //   );
    //   return res.status(401).json({
    //     message: "Invalid token payload.",
    //     code: "INVALID_PAYLOAD",
    //   });
    // }
    if (!userId) {
      console.log(
        `Authentication failed: Invalid token payload from IP ${req.ip}`
      );
      return res.status(401).json({
        message: "Invalid token payload.",
        code: "INVALID_PAYLOAD",
      });
    }

    // Get user data (with caching)
    const user = await getUserWithCache(userId);

    if (!user) {
      console.log(
        `Authentication failed: User ${decoded.userId} not found from IP ${req.ip}`
      );
      return res.status(403).json({
        message: "User account not found.",
        code: "USER_NOT_FOUND",
      });
    }

    if (!user.isActive) {
      console.log(
        `Authentication failed: User ${user.id} is inactive from IP ${req.ip}`
      );
      return res.status(403).json({
        message: "User account is deactivated. Contact administrator.",
        code: "ACCOUNT_DEACTIVATED",
      });
    }

    // Optional: Check token version for invalidation
    // if (user.tokenVersion !== decoded.tokenVersion) {
    //   console.log(`Authentication failed: Token version mismatch for user ${user.id}`);
    //   return res.status(401).json({
    //     message: "Token has been invalidated. Please log in again.",
    //     code: "TOKEN_INVALIDATED"
    //   });
    // }

    // Attach user info to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    };

    // Optional: Attach decoded token info
    req.token = {
      userId: decoded.userId,
      role: decoded.role,
      iat: decoded.iat,
      exp: decoded.exp,
    };

    console.log(
      `Authentication successful: User ${user.id} (${user.role}) from IP ${req.ip}`
    );
    next();
  } catch (error) {
    console.error("Authentication middleware error:", error);
    return res.status(500).json({
      message: "Internal authentication error.",
    });
  }
};

// Role-based authorization middleware
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

// Optional: Middleware to require token refresh
exports.requireFreshToken = (maxAge = 30 * 60) => {
  // 30 minutes default
  return (req, res, next) => {
    if (!req.token) {
      return res.status(401).json({
        message: "Token information not available.",
      });
    }

    const tokenAge = Date.now() / 1000 - req.token.iat;
    if (tokenAge > maxAge) {
      return res.status(401).json({
        message: "Token is too old. Please refresh your session.",
        code: "TOKEN_TOO_OLD",
      });
    }

    next();
  };
};

// Utility function to invalidate user cache (call when user data changes)
exports.invalidateUserCache = clearUserCache;

// Export rate limiting middleware
exports.authRateLimit = authRateLimit;

// Cleanup cache periodically (run this in a background job)
exports.cleanupCache = () => {
  const now = Date.now();
  for (const [key, value] of userCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      userCache.delete(key);
    }
  }
  console.log(`Cache cleanup completed. Current cache size: ${userCache.size}`);
};
