import express from "express";
import partnerRoutes from "./partner.routes.js";
import userRoutes from "./user.routes.js";

const indexRoutes = express.Router();

// Mount user routes
indexRoutes.use("/users", userRoutes);

// Mount partner routes
indexRoutes.use("/partners", partnerRoutes);

// Add other route groups here as needed
// indexRoutes.use("/services", serviceRoutes);
// indexRoutes.use("/bookings", bookingRoutes);

export default indexRoutes;
