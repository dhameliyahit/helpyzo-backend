import cors from "cors";
import "dotenv/config";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { connectdb } from "./database/connectDB.js";
import indexRoutes from "./routes/index.routes.js";

const app = express();
const PORT = process.env.PORT || 5000;
connectdb(process.env.DB_URL || "mongodb://localhost:27017/HelpyZo");

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use(cors());

// Logging
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.send("Hello World! Welcome to HelpyZo Backend");
});

app.use("/api", indexRoutes);

// 404 Not Found middleware
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
