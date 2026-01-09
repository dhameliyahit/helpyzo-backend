import mongoose from "mongoose";

const partnerSchema = new mongoose.Schema(
  {
    // Basic Information
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },

    // Business Information
    businessName: {
      type: String,
      required: true,
      trim: true,
    },
    businessType: {
      type: String,
      required: true,
      enum: ["individual", "company", "partnership"],
      default: "individual",
    },
    description: {
      type: String,
      maxlength: 1000,
      trim: true,
    },

    // Services Offered
    services: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        category: {
          type: String,
          required: true,
          enum: [
            "home_repair",
            "cleaning",
            "plumbing",
            "electrical",
            "painting",
            "carpentry",
            "gardening",
            "pest_control",
            "ac_repair",
            "appliance_repair",
            "automotive",
            "beauty",
            "health",
            "education",
            "other",
          ],
        },
        description: String,
        price: {
          type: Number,
          min: 0,
        },
        duration: {
          type: Number, // in minutes
          min: 15,
        },
        isActive: {
          type: Boolean,
          default: true,
        },
      },
    ],

    // Visiting Fee for home visits
    visitingFee: {
      amount: {
        type: Number,
        min: 0,
        default: 0,
      },
      currency: {
        type: String,
        default: "INR",
      },
      description: {
        type: String,
        default: "Home visit fee",
      },
      isActive: {
        type: Boolean,
        default: true,
      },
    },

    // Location
    address: {
      street: {
        type: String,
        trim: true,
      },
      city: {
        type: String,
        required: true,
        trim: true,
      },
      state: {
        type: String,
        required: true,
        trim: true,
      },
      zipCode: {
        type: String,
        required: true,
        trim: true,
      },
      country: {
        type: String,
        required: true,
        trim: true,
        default: "India",
      },
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
        validate: {
          validator: function (v) {
            return (
              v.length === 2 &&
              v[0] >= -180 &&
              v[0] <= 180 &&
              v[1] >= -90 &&
              v[1] <= 90
            );
          },
          message: "Invalid coordinates",
        },
      },
    },

    // Business Hours
    businessHours: {
      monday: { open: String, close: String, isOpen: Boolean },
      tuesday: { open: String, close: String, isOpen: Boolean },
      wednesday: { open: String, close: String, isOpen: Boolean },
      thursday: { open: String, close: String, isOpen: Boolean },
      friday: { open: String, close: String, isOpen: Boolean },
      saturday: { open: String, close: String, isOpen: Boolean },
      sunday: { open: String, close: String, isOpen: Boolean },
    },

    // Media
    avatar: {
      url: {
        type: String, // Profile picture URL
        default: null,
      },
      filePath: String, // GitHub file path for deletion
      sha: String, // GitHub SHA for updates/deletion
    },
    bannerImage: {
      url: {
        type: String, // Banner/cover image URL
        default: null,
      },
      filePath: String, // GitHub file path for deletion
      sha: String, // GitHub SHA for updates/deletion
    },
    portfolioImages: [
      {
        type: {
          type: String,
          enum: ["before", "after"],
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        caption: String,
        loc: {
          type: {
            type: String,
            enum: ["Point"],
            default: "Point",
          },
          coordinates: {
            type: [Number], // [longitude, latitude]
            validate: {
              validator: function (v) {
                return (
                  v.length === 2 &&
                  v[0] >= -180 &&
                  v[0] <= 180 &&
                  v[1] >= -90 &&
                  v[1] <= 90
                );
              },
              message: "Invalid coordinates",
            },
          },
        },
        filePath: String, // GitHub file path for deletion
        sha: String, // GitHub SHA for updates/deletion
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Ratings and Reviews
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },

    // Verification and Status
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    role: {
      type: String,
      enum: ["user", "partner", "admin"],
      default: "partner",
    },

    // Additional Information
    licenseNumber: String,
    yearsOfExperience: {
      type: Number,
      min: 0,
    },
    certifications: [
      {
        name: String,
        issuer: String,
        issueDate: Date,
        expiryDate: Date,
      },
    ],

    // Contact Preferences
    contactMethods: {
      phone: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      whatsapp: { type: Boolean, default: false },
    },

    // Payment Information
    paymentMethods: [
      {
        type: String,
        enum: ["cash", "card", "upi", "online"],
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
partnerSchema.index({ email: 1 });
partnerSchema.index({ phone: 1 });
partnerSchema.index({ location: "2dsphere" });
partnerSchema.index({ "services.category": 1 });
partnerSchema.index({ "services.name": 1 });
partnerSchema.index({ role: 1 });
partnerSchema.index({ isActive: 1 });
partnerSchema.index({ isVerified: 1 });
partnerSchema.index({ rating: -1 });

// Virtual for full address
partnerSchema.virtual("fullAddress").get(function () {
  const addr = this.address;
  return `${
    addr.street || ""
  }, ${addr.city}, ${addr.state} ${addr.zipCode}, ${addr.country}`;
});

// Static method to find partners near a location
partnerSchema.statics.findNearby = function (
  longitude,
  latitude,
  maxDistance = 10000,
  filters = {}
) {
  const query = {
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        $maxDistance: maxDistance,
      },
    },
    isActive: true,
    isVerified: true, // Only show verified partners
  };

  // Add filters
  if (filters.category) {
    query["services.category"] = filters.category;
  }

  if (filters.serviceName) {
    query["services.name"] = { $regex: filters.serviceName, $options: "i" };
  }

  if (filters.minRating) {
    query.rating = { $gte: filters.minRating };
  }

  return this.find(query).select("-password");
};

// Static method to find partners by service category
partnerSchema.statics.findByServiceCategory = function (category, limit = 20) {
  return this.find({
    "services.category": category,
    isActive: true,
    isVerified: true,
  })
    .sort({ rating: -1 })
    .limit(limit)
    .select("-password");
};

const Partner = mongoose.model("Partner", partnerSchema);

export default Partner;
