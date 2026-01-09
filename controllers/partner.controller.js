import partnerService from "../services/partner.service.js";

// Register partner
export const register = async (req, res) => {
  try {
    const partnerData = req.body;

    // Basic validation
    const {
      name,
      email,
      phone,
      password,
      businessName,
      services,
      address,
      location,
    } = partnerData;

    if (
      !name ||
      !email ||
      !phone ||
      !password ||
      !businessName ||
      !services ||
      !address ||
      !location
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    // Validate services array
    if (!Array.isArray(services) || services.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one service must be provided",
      });
    }

    const result = await partnerService.register(partnerData);

    res.status(201).json({
      success: true,
      message: "Partner registered successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Login partner
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const result = await partnerService.login({ email, password });

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

// Get partner profile
export const getProfile = async (req, res) => {
  try {
    const partnerId = req.partner.id; // From auth middleware
    const partner = await partnerService.getProfile(partnerId);

    res.json({
      success: true,
      data: partner,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// Update partner profile
export const updateProfile = async (req, res) => {
  try {
    const partnerId = req.partner.id; // From auth middleware
    const updateData = req.body;

    const partner = await partnerService.updateProfile(partnerId, updateData);

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: partner,
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
    const partnerId = req.partner.id; // From auth middleware
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

    const result = await partnerService.changePassword(
      partnerId,
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

// Get nearby partners
export const getNearbyPartners = async (req, res) => {
  try {
    const {
      longitude,
      latitude,
      maxDistance,
      category,
      serviceName,
      minRating,
    } = req.query;

    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: "Longitude and latitude are required",
      });
    }

    const lng = parseFloat(longitude);
    const lat = parseFloat(latitude);
    const distance = maxDistance ? parseInt(maxDistance) : 10000;

    const filters = {};
    if (category) filters.category = category;
    if (serviceName) filters.serviceName = serviceName;
    if (minRating) filters.minRating = parseFloat(minRating);

    const partners = await partnerService.getNearbyPartners(
      lng,
      lat,
      distance,
      filters
    );

    res.json({
      success: true,
      data: partners,
      count: partners.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get partners by category
export const getPartnersByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { limit } = req.query;

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category is required",
      });
    }

    const partners = await partnerService.getPartnersByCategory(
      category,
      limit ? parseInt(limit) : 20
    );

    res.json({
      success: true,
      data: partners,
      count: partners.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Search partners
export const searchPartners = async (req, res) => {
  try {
    const { q: serviceName } = req.query;
    const { limit } = req.query;

    if (!serviceName) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const partners = await partnerService.searchPartners(
      serviceName,
      limit ? parseInt(limit) : 20
    );

    res.json({
      success: true,
      data: partners,
      count: partners.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get partner details
export const getPartnerDetails = async (req, res) => {
  try {
    const { partnerId } = req.params;

    const partner = await partnerService.getPartnerDetails(partnerId);

    res.json({
      success: true,
      data: partner,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// Update services
export const updateServices = async (req, res) => {
  try {
    const partnerId = req.partner.id; // From auth middleware
    const { services } = req.body;

    if (!services || !Array.isArray(services)) {
      return res.status(400).json({
        success: false,
        message: "Services array is required",
      });
    }

    const partner = await partnerService.updateServices(partnerId, services);

    res.json({
      success: true,
      message: "Services updated successfully",
      data: partner,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Deactivate account
export const deactivateAccount = async (req, res) => {
  try {
    const partnerId = req.partner.id; // From auth middleware

    const result = await partnerService.deactivateAccount(partnerId);

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

// Get service categories
export const getServiceCategories = async (req, res) => {
  try {
    const categories = partnerService.getServiceCategories();

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update avatar
export const updateAvatar = async (req, res) => {
  try {
    const partnerId = req.partner.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Avatar image is required",
      });
    }

    const result = await partnerService.updateAvatar(
      partnerId,
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

// Update banner
export const updateBanner = async (req, res) => {
  try {
    const partnerId = req.partner.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Banner image is required",
      });
    }

    const result = await partnerService.updateBanner(
      partnerId,
      req.file.buffer,
      req.file.originalname
    );

    res.json({
      success: true,
      message: "Banner updated successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Add portfolio images
export const addPortfolioImages = async (req, res) => {
  try {
    const partnerId = req.partner.id;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Portfolio images are required",
      });
    }

    const { types, captions, locs } = req.body;

    const result = await partnerService.addPortfolioImages(
      partnerId,
      req.files,
      types,
      captions,
      locs
    );

    res.json({
      success: true,
      message: "Portfolio images added successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Update portfolio image
export const updatePortfolioImage = async (req, res) => {
  try {
    const partnerId = req.partner.id;
    const { imageId } = req.params;
    const updateData = req.body;

    const result = await partnerService.updatePortfolioImage(
      partnerId,
      imageId,
      updateData
    );

    res.json({
      success: true,
      message: "Portfolio image updated successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete portfolio image
export const deletePortfolioImage = async (req, res) => {
  try {
    const partnerId = req.partner.id;
    const { imageId } = req.params;

    const result = await partnerService.deletePortfolioImage(
      partnerId,
      imageId
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

// Delete avatar
export const deleteAvatar = async (req, res) => {
  try {
    const partnerId = req.partner.id;

    const result = await partnerService.deleteAvatar(partnerId);

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

// Delete banner
export const deleteBanner = async (req, res) => {
  try {
    const partnerId = req.partner.id;

    const result = await partnerService.deleteBanner(partnerId);

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

// Update visiting fee
export const updateVisitingFee = async (req, res) => {
  try {
    const partnerId = req.partner.id;
    const visitingFeeData = req.body;

    const result = await partnerService.updateVisitingFee(
      partnerId,
      visitingFeeData
    );

    res.json({
      success: true,
      message: "Visiting fee updated successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get visiting fee
export const getVisitingFee = async (req, res) => {
  try {
    const partnerId = req.partner.id;

    const result = await partnerService.getVisitingFee(partnerId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
