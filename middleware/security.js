import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5050",
  "https://agri-resilient-fyp-frontend-95mt.vercel.app/" // <-- Apna frontend URL yahan likho
];

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later."
  }
});

const securityMiddleware = (app) => {
  app.use(
    helmet({
      crossOriginResourcePolicy: false,
      contentSecurityPolicy: false
    })
  );

  app.use(
    cors({
      origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"]
    })
  );

  app.use("/api", limiter);
};

export default securityMiddleware;