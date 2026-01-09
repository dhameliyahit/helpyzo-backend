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

// Single avatar upload for users
export const uploadUserAvatar = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
}).single("avatar");

// Middleware to handle user avatar upload and storage
export const handleUserAvatarUpload = async (req, res, next) => {
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
      "users/avatars"
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

// Error handling middleware for multer
export const handleUserMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum size is 5MB.",
      });
    }
  }

  next(error);
};
