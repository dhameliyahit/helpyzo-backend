import userService from "../services/user.service.js";

// Register user
export const register = async (req, res) => {
  try {
    const userData = req.body;

    // Basic validation
    const { name, email, phone, password, address, location } = userData;
    if (!name || !email || !phone || !password || !address || !location) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    const result = await userService.register(userData);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const result = await userService.login({ email, password });

    res.json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};

// Get user profile
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id; // From auth middleware
    const user = await userService.getProfile(userId);

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id; // From auth middleware
    const updateData = req.body;

    const user = await userService.updateProfile(userId, updateData);

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id; // From auth middleware
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long",
      });
    }

    const result = await userService.changePassword(
      userId,
      currentPassword,
      newPassword
    );

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get nearby users
export const getNearbyUsers = async (req, res) => {
  try {
    const { longitude, latitude, maxDistance } = req.query;

    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: "Longitude and latitude are required",
      });
    }

    const lng = parseFloat(longitude);
    const lat = parseFloat(latitude);
    const distance = maxDistance ? parseInt(maxDistance) : 10000;

    const users = await userService.getNearbyUsers(lng, lat, distance);

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Deactivate account
export const deactivateAccount = async (req, res) => {
  try {
    const userId = req.user.id; // From auth middleware

    const result = await userService.deactivateAccount(userId);

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Update avatar
export const updateAvatar = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Avatar image is required",
      });
    }

    const result = await userService.updateAvatar(
      userId,
      req.file.buffer,
      req.file.originalname
    );

    res.json({
      success: true,
      message: "Avatar updated successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete avatar
export const deleteAvatar = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await userService.deleteAvatar(userId);

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
