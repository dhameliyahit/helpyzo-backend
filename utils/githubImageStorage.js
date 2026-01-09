import axios from "axios";

// GitHub configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_BRANCH = process.env.GITHUB_BRANCH;
const GITHUB_API_BASE = "https://api.github.com";

// Utility class for GitHub image storage
class GitHubImageStorage {
  constructor() {
    if (!GITHUB_TOKEN) {
      throw new Error("GITHUB_TOKEN environment variable is required");
    }
  }

  // Upload image to GitHub repository
  async uploadImage(imageBuffer, fileName, folder = "images") {
    try {
      // Generate unique filename with timestamp
      const timestamp = Date.now();
      const extension = this.getFileExtension(fileName);
      const uniqueFileName = `${folder}/${timestamp}_${fileName}`;

      // Convert buffer to base64
      const base64Content = imageBuffer.toString("base64");

      // GitHub API payload
      const payload = {
        message: `Upload image: ${uniqueFileName}`,
        content: base64Content,
        branch: GITHUB_BRANCH,
      };

      // Upload to GitHub
      const response = await axios.put(
        `${GITHUB_API_BASE}/repos/${GITHUB_REPO}/contents/${uniqueFileName}`,
        payload,
        {
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Return the raw GitHub URL
      const imageUrl = response.data.content.download_url;

      return {
        success: true,
        url: imageUrl,
        fileName: uniqueFileName,
        sha: response.data.content.sha,
      };
    } catch (error) {
      console.error(
        "GitHub upload error:",
        error.response?.data || error.message
      );
      throw new Error("Failed to upload image to GitHub");
    }
  }

  // Upload multiple images
  async uploadMultipleImages(images, folder = "images") {
    try {
      const uploadPromises = images.map((image, index) =>
        this.uploadImage(
          image.buffer,
          image.originalname || `image_${index}.jpg`,
          folder
        )
      );

      const results = await Promise.all(uploadPromises);

      return {
        success: true,
        images: results.map((result) => ({
          url: result.url,
          fileName: result.fileName,
          sha: result.sha,
        })),
      };
    } catch (error) {
      throw new Error("Failed to upload multiple images");
    }
  }

  // Delete image from GitHub (optional, for cleanup)
  async deleteImage(filePath) {
    try {
      // First get the file info to get SHA
      const getResponse = await axios.get(
        `${GITHUB_API_BASE}/repos/${GITHUB_REPO}/contents/${filePath}`,
        {
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
          },
        }
      );

      // Delete the file
      await axios.delete(
        `${GITHUB_API_BASE}/repos/${GITHUB_REPO}/contents/${filePath}`,
        {
          data: {
            message: `Delete image: ${filePath}`,
            sha: getResponse.data.sha,
            branch: GITHUB_BRANCH,
          },
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      return { success: true };
    } catch (error) {
      console.error(
        "GitHub delete error:",
        error.response?.data || error.message
      );
      throw new Error("Failed to delete image from GitHub");
    }
  }

  // Update image in GitHub repository
  async updateImage(filePath, imageBuffer, fileName, sha) {
    try {
      // Convert buffer to base64
      const base64Content = imageBuffer.toString("base64");

      // Update payload
      const payload = {
        message: `Update image: ${fileName}`,
        content: base64Content,
        sha: sha,
        branch: GITHUB_BRANCH,
      };

      // Update the file
      const response = await axios.put(
        `${GITHUB_API_BASE}/repos/${GITHUB_REPO}/contents/${filePath}`,
        payload,
        {
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      return {
        success: true,
        url: response.data.content.download_url,
        fileName: filePath,
        sha: response.data.content.sha,
      };
    } catch (error) {
      console.error(
        "GitHub update error:",
        error.response?.data || error.message
      );
      throw new Error("Failed to update image on GitHub");
    }
  }

  // Delete image from GitHub repository (improved version with SHA parameter)
  async deleteImageBySha(filePath, sha) {
    try {
      // Delete payload
      const payload = {
        message: `Delete image: ${filePath}`,
        sha: sha,
        branch: GITHUB_BRANCH,
      };

      // Delete the file
      await axios.delete(
        `${GITHUB_API_BASE}/repos/${GITHUB_REPO}/contents/${filePath}`,
        {
          data: payload,
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      return { success: true };
    } catch (error) {
      console.error(
        "GitHub delete error:",
        error.response?.data || error.message
      );
      throw new Error("Failed to delete image from GitHub");
    }
  }

  // Get file extension from filename
  getFileExtension(fileName) {
    return fileName.split(".").pop().toLowerCase();
  }

  // Validate image file
  validateImage(file) {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error(
        "Invalid image type. Only JPEG, PNG, and WebP are allowed."
      );
    }

    if (file.size > maxSize) {
      throw new Error("Image size too large. Maximum size is 5MB.");
    }

    return true;
  }

  // Validate multiple images
  validateMultipleImages(files) {
    const maxFiles = 10; // Maximum 10 images for portfolio

    if (files.length > maxFiles) {
      throw new Error(`Too many images. Maximum ${maxFiles} images allowed.`);
    }

    files.forEach((file, index) => {
      try {
        this.validateImage(file);
      } catch (error) {
        throw new Error(`Image ${index + 1}: ${error.message}`);
      }
    });

    return true;
  }
}

// Create singleton instance
const githubImageStorage = new GitHubImageStorage();

export default githubImageStorage;
