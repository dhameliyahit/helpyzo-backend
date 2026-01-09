import express from "express";
import {
  changePassword,
  deactivateAccount,
  getNearbyUsers,
  getProfile,
  login,
  register,
  updateProfile,
  verifyToken,
} from "../controllers/user.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import {
  handleUserAvatarUpload,
  handleUserMulterError,
  uploadUserAvatar,
} from "../middlewares/userUpload.middleware.js";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/verify-token", verifyToken);

// Protected routes (require authentication)
router.use(authenticate); // All routes below require authentication

router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.put("/change-password", changePassword);
router.put("/deactivate", deactivateAccount);

// Image management routes
router.put("/avatar", uploadUserAvatar, handleUserAvatarUpload, updateAvatar);
router.delete("/avatar", deleteAvatar);

// Routes that may require specific roles
router.get("/nearby", authorize("user", "partner", "admin"), getNearbyUsers);

// Error handling for multer
router.use(handleUserMulterError);

export default router;
