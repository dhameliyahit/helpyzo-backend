import jwt from "jsonwebtoken";
import Partner from "../models/partner.model.js";

// Middleware to authenticate JWT token for partners
export const authenticatePartner = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );
    const partner = await Partner.findById(decoded.partnerId).select(
      "-password"
    );

    if (!partner || !partner.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid token or partner deactivated.",
      });
    }

    req.partner = partner;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid token.",
    });
  }
};

// Middleware to check if partner has required role
export const authorizePartner = (...roles) => {
  return (req, res, next) => {
    if (!req.partner) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!roles.includes(req.partner.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Insufficient permissions.",
      });
    }

    next();
  };
};

// Optional authentication for partners (doesn't fail if no token)
export const optionalPartnerAuth = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "your-secret-key"
      );
      const partner = await Partner.findById(decoded.partnerId).select(
        "-password"
      );

      if (partner && partner.isActive) {
        req.partner = partner;
      }
    }

    next();
  } catch (error) {
    // Ignore token errors for optional auth
    next();
  }
};
