import express from "express";
import dotenv from "dotenv";
import compression from "compression";
import path from "path";
import { fileURLToPath } from "url";

import securityMiddleware from "./middleware/security.js";
import detectRoutes from "./routes/detect.js";
import advisoryRoutes from "./routes/advisory.js";
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import chatRoutes from "./routes/chat.js";
import contactRoutes from "./routes/contact.js";
import blogRoutes from "./routes/blog.js";
import contentRoutes from "./routes/content.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// Compression
app.use(compression());

// Security
securityMiddleware(app);

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cache
app.use((req, res, next) => {
  if (req.method === "GET") {
    res.set("Cache-Control", "public, max-age=60");
  } else {
    res.set("Cache-Control", "no-store");
  }
  next();
});

// Static Uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// =======================
// ROOT ROUTE
// =======================
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "AgriResilient Backend is Running 🚀",
    health: "/health"
  });
});

// =======================
// HEALTH ROUTE
// =======================
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    worker: process.pid,
    environment: process.env.NODE_ENV
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/advisory", advisoryRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/content", contentRoutes);
app.use("/api", detectRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
});

export default app;