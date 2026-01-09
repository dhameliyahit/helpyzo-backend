import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

class UserService {
  // Generate JWT token
  generateToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_SECRET || "qwertyuiop", {
      expiresIn: "7d",
    });
  }

  // Register a new user
  async register(userData) {
    const { email, phone } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      throw new Error("User with this email or phone already exists");
    }

    // Create new user
    const user = new User(userData);
    await user.save();

    // Generate token
    const token = this.generateToken(user._id);

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
      },
      token,
    };
  }

  // Login user
  async login(credentials) {
    const { email, password } = credentials;

    // Find user by email
    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      throw new Error("Invalid credentials");
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    // Generate token
    const token = this.generateToken(user._id);

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
      },
      token,
    };
  }

  // Get user profile
  async getProfile(userId) {
    const user = await User.findById(userId).select("-password");
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  }

  // Update user profile
  async updateProfile(userId, updateData) {
    // Remove sensitive fields
    const { password, email, phone, role, ...allowedUpdates } = updateData;

    const user = await User.findByIdAndUpdate(userId, allowedUpdates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  // Change password
  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      throw new Error("Current password is incorrect");
    }

    // Update password (pre-save middleware will hash it)
    user.password = newPassword;
    await user.save();

    return { message: "Password changed successfully" };
  }

  // Get users near a location
  async getNearbyUsers(longitude, latitude, maxDistance = 10000) {
    const users = await User.findNearby(
      longitude,
      latitude,
      maxDistance
    ).select("-password -location");
    return users;
  }

  // Deactivate user account
  async deactivateAccount(userId) {
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      throw new Error("User not found");
    }

    return { message: "Account deactivated successfully" };
  }

  // Verify JWT token and get user
  async verifyToken(token) {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "your-secret-key"
      );
      const user = await User.findById(decoded.userId).select("-password");
      if (!user || !user.isActive) {
        throw new Error("Invalid token");
      }
      return user;
    } catch (error) {
      throw new Error("Invalid token");
    }
  }

  // Update user avatar
  async updateAvatar(userId, imageBuffer, fileName) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Delete old avatar from GitHub if exists
    if (user.avatar && user.avatar.filePath && user.avatar.sha) {
      try {
        await githubImageStorage.deleteImageBySha(
          user.avatar.filePath,
          user.avatar.sha
        );
      } catch (error) {
        console.warn("Failed to delete old avatar from GitHub:", error.message);
      }
    }

    // Upload new avatar
    const result = await githubImageStorage.uploadImage(
      imageBuffer,
      fileName,
      "users/avatars"
    );

    // Update user
    user.avatar = {
      url: result.url,
      filePath: result.fileName,
      sha: result.sha,
    };
    await user.save();

    return {
      url: result.url,
      filePath: result.fileName,
      sha: result.sha,
    };
  }

  // Delete user avatar
  async deleteAvatar(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (!user.avatar || !user.avatar.filePath) {
      throw new Error("No avatar to delete");
    }

    // Delete from GitHub
    try {
      await githubImageStorage.deleteImageBySha(
        user.avatar.filePath,
        user.avatar.sha
      );
    } catch (error) {
      console.warn("Failed to delete avatar from GitHub:", error.message);
    }

    // Remove from database
    user.avatar = null;
    await user.save();

    return { message: "Avatar deleted successfully" };
  }
}

export default new UserService();
