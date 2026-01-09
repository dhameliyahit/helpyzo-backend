import express from "express";
import {
  addPortfolioImages,
  changePassword,
  deactivateAccount,
  deleteAvatar,
  deleteBanner,
  deletePortfolioImage,
  getNearbyPartners,
  getPartnerDetails,
  getPartnersByCategory,
  getServiceCategories,
  getVisitingFee,
  login,
  register,
  searchPartners,
  updateAvatar,
  updateBanner,
  updatePortfolioImage,
  updateProfile,
  updateServices,
  updateVisitingFee,
  verifyToken,
} from "../controllers/partner.controller.js";
import { authenticatePartner } from "../middlewares/partnerAuth.middleware.js";
import {
  handleAvatarUpload,
  handleBannerUpload,
  handleMulterError,
  handlePortfolioUpload,
  uploadAvatar,
  uploadBanner,
  uploadPortfolio,
} from "../middlewares/upload.middleware.js";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/verify-token", verifyToken);
router.get("/categories", getServiceCategories);

// Routes for finding partners (can be used by users and partners)
router.get("/nearby", getNearbyPartners);
router.get("/category/:category", getPartnersByCategory);
router.get("/search", searchPartners);
router.get("/:partnerId", getPartnerDetails);

// Protected routes (require partner authentication)
router.use(authenticatePartner); // All routes below require authentication

router.put("/profile/me", updateProfile);
router.put("/change-password", changePassword);
router.put("/services", updateServices);
router.put("/deactivate", deactivateAccount);

// Image management routes
router.put("/avatar", uploadAvatar, handleAvatarUpload, updateAvatar);
router.delete("/avatar", deleteAvatar);

router.put("/banner", uploadBanner, handleBannerUpload, updateBanner);
router.delete("/banner", deleteBanner);

router.post(
  "/portfolio",
  uploadPortfolio,
  handlePortfolioUpload,
  addPortfolioImages
);
router.put("/portfolio/:imageId", updatePortfolioImage);
router.delete("/portfolio/:imageId", deletePortfolioImage);

// Visiting fee routes
router.put("/visiting-fee", updateVisitingFee);
router.get("/visiting-fee", getVisitingFee);

// Error handling for multer
router.use(handleMulterError);

export default router;
