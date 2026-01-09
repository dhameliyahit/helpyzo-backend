import multer from "multer";
import githubImageStorage from "../utils/githubImageStorage.js";

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter for images only
const imageFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, PNG, and WebP images are allowed."
      ),
      false
    );
  }
};

// Create multer upload instances for different use cases

// Single avatar upload
export const uploadAvatar = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
}).single("avatar");

// Single banner upload
export const uploadBanner = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
}).single("banner");

// Multiple portfolio images upload
export const uploadPortfolio = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 10, // Maximum 10 files
  },
}).array("portfolio", 10);

// Middleware to handle avatar upload and storage
export const handleAvatarUpload = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    // Validate image
    githubImageStorage.validateImage(req.file);

    // Upload to GitHub
    const result = await githubImageStorage.uploadImage(
      req.file.buffer,
      req.file.originalname,
      "partners/avatars"
    );

    // Add image URL, file path, and SHA to request body
    req.body.avatar = {
      url: result.url,
      filePath: result.fileName,
      sha: result.sha,
    };
    req.uploadedAvatar = result;

    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Middleware to handle banner upload and storage
export const handleBannerUpload = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    // Validate image
    githubImageStorage.validateImage(req.file);

    // Upload to GitHub
    const result = await githubImageStorage.uploadImage(
      req.file.buffer,
      req.file.originalname,
      "partners/banners"
    );

    // Add image URL, file path, and SHA to request body
    req.body.bannerImage = {
      url: result.url,
      filePath: result.fileName,
      sha: result.sha,
    };
    req.uploadedBanner = result;

    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Middleware to handle portfolio images upload and storage
export const handlePortfolioUpload = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next();
    }

    // Validate images
    githubImageStorage.validateMultipleImages(req.files);

    // Upload to GitHub
    const result = await githubImageStorage.uploadMultipleImages(
      req.files,
      "partners/portfolio"
    );

    // Process portfolio images with types, captions, and location
    const portfolioImages = [];
    const { types, captions, locs } = req.body;

    result.images.forEach((image, index) => {
      const portfolioImage = {
        type: types && types[index] ? types[index] : "before",
        url: image.url,
        filePath: image.fileName,
        sha: image.sha, // We'll need to get SHA from individual uploads
        caption: captions && captions[index] ? captions[index] : "",
      };

      // Add location if provided
      if (locs && locs[index]) {
        try {
          const locData = JSON.parse(locs[index]);
          if (locData.coordinates && Array.isArray(locData.coordinates)) {
            portfolioImage.loc = {
              type: "Point",
              coordinates: locData.coordinates,
            };
          }
        } catch (error) {
          // Ignore invalid location data
          console.warn(`Invalid location data for image ${index}`);
        }
      }

      portfolioImages.push(portfolioImage);
    });

    // Add portfolio images to request body
    req.body.portfolioImages = portfolioImages;
    req.uploadedPortfolio = result;

    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Combined middleware for partner registration/update
export const handlePartnerImages = [
  uploadAvatar,
  uploadBanner,
  uploadPortfolio,
  handleAvatarUpload,
  handleBannerUpload,
  handlePortfolioUpload,
];

// Error handling middleware for multer
export const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum size is 5MB.",
      });
    }
    if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: "Too many files. Maximum 10 files allowed.",
      });
    }
  }

  next(error);
};
