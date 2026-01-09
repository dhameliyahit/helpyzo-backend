import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Partner from "../models/partner.model.js";
import githubImageStorage from "../utils/githubImageStorage.js";

class PartnerService {
  // Generate JWT token
  generateToken(partnerId) {
    return jwt.sign(
      { partnerId },
      process.env.JWT_SECRET || "your-secret-key",
      {
        expiresIn: "7d",
      }
    );
  }

  // Register a new partner
  async register(partnerData) {
    const { email, phone } = partnerData;

    // Check if partner already exists
    const existingPartner = await Partner.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingPartner) {
      throw new Error("Partner with this email or phone already exists");
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    partnerData.password = await bcrypt.hash(partnerData.password, salt);

    // Create new partner
    const partner = new Partner(partnerData);
    await partner.save();

    // Generate token
    const token = this.generateToken(partner._id);

    return {
      partner: {
        id: partner._id,
        name: partner.name,
        email: partner.email,
        phone: partner.phone,
        businessName: partner.businessName,
        role: partner.role,
        avatar: partner.avatar,
        isVerified: partner.isVerified,
      },
      token,
    };
  }

  // Login partner
  async login(credentials) {
    const { email, password } = credentials;

    // Find partner by email
    const partner = await Partner.findOne({ email, isActive: true });
    if (!partner) {
      throw new Error("Invalid credentials");
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, partner.password);
    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    // Generate token
    const token = this.generateToken(partner._id);

    return {
      partner: {
        id: partner._id,
        name: partner.name,
        email: partner.email,
        phone: partner.phone,
        businessName: partner.businessName,
        role: partner.role,
        avatar: partner.avatar,
        isVerified: partner.isVerified,
      },
      token,
    };
  }

  // Get partner profile
  async getProfile(partnerId) {
    const partner = await Partner.findById(partnerId).select("-password");
    if (!partner) {
      throw new Error("Partner not found");
    }
    return partner;
  }

  // Update partner profile
  async updateProfile(partnerId, updateData) {
    // Remove sensitive fields
    const { password, email, phone, role, ...allowedUpdates } = updateData;

    // Handle image updates
    const imageFields = ["avatar", "bannerImage", "portfolioImages"];
    const imageUpdates = {};

    imageFields.forEach((field) => {
      if (allowedUpdates[field] !== undefined) {
        imageUpdates[field] = allowedUpdates[field];
        delete allowedUpdates[field];
      }
    });

    const partner = await Partner.findByIdAndUpdate(
      partnerId,
      {
        ...allowedUpdates,
        ...imageUpdates,
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    if (!partner) {
      throw new Error("Partner not found");
    }

    return partner;
  }

  // Change password
  async changePassword(partnerId, currentPassword, newPassword) {
    const partner = await Partner.findById(partnerId);
    if (!partner) {
      throw new Error("Partner not found");
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      partner.password
    );
    if (!isCurrentPasswordValid) {
      throw new Error("Current password is incorrect");
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    partner.password = await bcrypt.hash(newPassword, salt);
    await partner.save();

    return { message: "Password changed successfully" };
  }

  // Get nearby partners
  async getNearbyPartners(
    longitude,
    latitude,
    maxDistance = 10000,
    filters = {}
  ) {
    const partners = await Partner.findNearby(
      longitude,
      latitude,
      maxDistance,
      filters
    );
    return partners;
  }

  // Get partners by service category
  async getPartnersByCategory(category, limit = 20) {
    const partners = await Partner.findByServiceCategory(category, limit);
    return partners;
  }

  // Search partners by service name
  async searchPartners(serviceName, limit = 20) {
    const partners = await Partner.find({
      "services.name": { $regex: serviceName, $options: "i" },
      isActive: true,
      isVerified: true,
    })
      .sort({ rating: -1 })
      .limit(limit)
      .select("-password");

    return partners;
  }

  // Get partner details with services
  async getPartnerDetails(partnerId) {
    const partner = await Partner.findById(partnerId)
      .select("-password")
      .populate(); // Add any population if needed

    if (!partner) {
      throw new Error("Partner not found");
    }

    return partner;
  }

  // Update partner services
  async updateServices(partnerId, services) {
    const partner = await Partner.findByIdAndUpdate(
      partnerId,
      { services },
      { new: true, runValidators: true }
    ).select("-password");

    if (!partner) {
      throw new Error("Partner not found");
    }

    return partner;
  }

  // Deactivate partner account
  async deactivateAccount(partnerId) {
    const partner = await Partner.findByIdAndUpdate(
      partnerId,
      { isActive: false },
      { new: true }
    );

    if (!partner) {
      throw new Error("Partner not found");
    }

    return { message: "Account deactivated successfully" };
  }

  // Verify JWT token and get partner
  async verifyToken(token) {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "your-secret-key"
      );
      const partner = await Partner.findById(decoded.partnerId).select(
        "-password"
      );
      if (!partner || !partner.isActive) {
        throw new Error("Invalid token");
      }
      return partner;
    } catch (error) {
      throw new Error("Invalid token");
    }
  }

  // Update partner avatar
  async updateAvatar(partnerId, imageBuffer, fileName) {
    const partner = await Partner.findById(partnerId);
    if (!partner) {
      throw new Error("Partner not found");
    }

    // Delete old avatar from GitHub if exists
    if (partner.avatar && partner.avatar.filePath && partner.avatar.sha) {
      try {
        await githubImageStorage.deleteImageBySha(
          partner.avatar.filePath,
          partner.avatar.sha
        );
      } catch (error) {
        console.warn("Failed to delete old avatar from GitHub:", error.message);
      }
    }

    // Upload new avatar
    const result = await githubImageStorage.uploadImage(
      imageBuffer,
      fileName,
      "partners/avatars"
    );

    // Update partner
    partner.avatar = {
      url: result.url,
      filePath: result.fileName,
      sha: result.sha,
    };
    await partner.save();

    return {
      url: result.url,
      filePath: result.fileName,
      sha: result.sha,
    };
  }

  // Update partner banner
  async updateBanner(partnerId, imageBuffer, fileName) {
    const partner = await Partner.findById(partnerId);
    if (!partner) {
      throw new Error("Partner not found");
    }

    // Delete old banner from GitHub if exists
    if (
      partner.bannerImage &&
      partner.bannerImage.filePath &&
      partner.bannerImage.sha
    ) {
      try {
        await githubImageStorage.deleteImageBySha(
          partner.bannerImage.filePath,
          partner.bannerImage.sha
        );
      } catch (error) {
        console.warn("Failed to delete old banner from GitHub:", error.message);
      }
    }

    // Upload new banner
    const result = await githubImageStorage.uploadImage(
      imageBuffer,
      fileName,
      "partners/banners"
    );

    // Update partner
    partner.bannerImage = {
      url: result.url,
      filePath: result.fileName,
      sha: result.sha,
    };
    await partner.save();

    return {
      url: result.url,
      filePath: result.fileName,
      sha: result.sha,
    };
  }

  // Add portfolio images
  async addPortfolioImages(partnerId, images, types, captions, locs) {
    const partner = await Partner.findById(partnerId);
    if (!partner) {
      throw new Error("Partner not found");
    }

    // Upload images to GitHub
    const result = await githubImageStorage.uploadMultipleImages(
      images,
      "partners/portfolio"
    );

    // Process and add portfolio images
    const newPortfolioImages = result.images.map((image, index) => {
      const portfolioImage = {
        type: types && types[index] ? types[index] : "before",
        url: image.url,
        filePath: image.fileName,
        sha: image.sha,
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
          console.warn(`Invalid location data for image ${index}`);
        }
      }

      return portfolioImage;
    });

    // Add to partner's portfolio
    partner.portfolioImages.push(...newPortfolioImages);
    await partner.save();

    return newPortfolioImages;
  }

  // Update portfolio image
  async updatePortfolioImage(partnerId, imageId, updateData) {
    const partner = await Partner.findById(partnerId);
    if (!partner) {
      throw new Error("Partner not found");
    }

    const imageIndex = partner.portfolioImages.findIndex(
      (img) => img._id.toString() === imageId
    );

    if (imageIndex === -1) {
      throw new Error("Portfolio image not found");
    }

    const image = partner.portfolioImages[imageIndex];

    // Update fields
    if (updateData.type) image.type = updateData.type;
    if (updateData.caption !== undefined) image.caption = updateData.caption;
    if (updateData.loc && updateData.loc.coordinates) {
      image.loc = {
        type: "Point",
        coordinates: updateData.loc.coordinates,
      };
    }

    await partner.save();

    return partner.portfolioImages[imageIndex];
  }

  // Delete portfolio image
  async deletePortfolioImage(partnerId, imageId) {
    const partner = await Partner.findById(partnerId);
    if (!partner) {
      throw new Error("Partner not found");
    }

    const imageIndex = partner.portfolioImages.findIndex(
      (img) => img._id.toString() === imageId
    );

    if (imageIndex === -1) {
      throw new Error("Portfolio image not found");
    }

    const image = partner.portfolioImages[imageIndex];

    // Delete from GitHub
    if (image.filePath && image.sha) {
      try {
        await githubImageStorage.deleteImageBySha(image.filePath, image.sha);
      } catch (error) {
        console.warn("Failed to delete image from GitHub:", error.message);
      }
    }

    // Remove from database
    partner.portfolioImages.splice(imageIndex, 1);
    await partner.save();

    return { message: "Portfolio image deleted successfully" };
  }

  // Delete avatar
  async deleteAvatar(partnerId) {
    const partner = await Partner.findById(partnerId);
    if (!partner) {
      throw new Error("Partner not found");
    }

    if (!partner.avatar || !partner.avatar.filePath) {
      throw new Error("No avatar to delete");
    }

    // Delete from GitHub
    try {
      await githubImageStorage.deleteImageBySha(
        partner.avatar.filePath,
        partner.avatar.sha
      );
    } catch (error) {
      console.warn("Failed to delete avatar from GitHub:", error.message);
    }

    // Remove from database
    partner.avatar = null;
    await partner.save();

    return { message: "Avatar deleted successfully" };
  }

  // Delete banner
  async deleteBanner(partnerId) {
    const partner = await Partner.findById(partnerId);
    if (!partner) {
      throw new Error("Partner not found");
    }

    if (!partner.bannerImage || !partner.bannerImage.filePath) {
      throw new Error("No banner to delete");
    }

    // Delete from GitHub
    try {
      await githubImageStorage.deleteImageBySha(
        partner.bannerImage.filePath,
        partner.bannerImage.sha
      );
    } catch (error) {
      console.warn("Failed to delete banner from GitHub:", error.message);
    }

    // Remove from database
    partner.bannerImage = null;
    await partner.save();

    return { message: "Banner deleted successfully" };
  }

  // Update visiting fee
  async updateVisitingFee(partnerId, visitingFeeData) {
    const partner = await Partner.findById(partnerId);
    if (!partner) {
      throw new Error("Partner not found");
    }

    // Validate visiting fee data
    if (visitingFeeData.amount !== undefined && visitingFeeData.amount < 0) {
      throw new Error("Visiting fee amount cannot be negative");
    }

    // Update visiting fee
    partner.visitingFee = {
      ...partner.visitingFee,
      ...visitingFeeData,
    };

    await partner.save();

    return partner.visitingFee;
  }

  // Get visiting fee
  async getVisitingFee(partnerId) {
    const partner = await Partner.findById(partnerId).select("visitingFee");
    if (!partner) {
      throw new Error("Partner not found");
    }

    return partner.visitingFee;
  }
}

export default new PartnerService();
