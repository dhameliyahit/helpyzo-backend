import mongoose from "mongoose";

export const connectdb = async (DB_URL) => {
  try {
    await mongoose.connect(DB_URL);
    console.log("Database connected successfully");
  } catch (error) {
    console.log("Error while connecting to database", error);
    process.exit(1);
  }
};
