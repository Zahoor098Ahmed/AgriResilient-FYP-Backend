import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

// Rate limiting: max 100 requests per IP per minute
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after a minute'
  }
});

const securityMiddleware = (app) => {
  // Sets secure HTTP headers
  app.use(helmet());

  // CORS: only allow frontend origin from .env
  app.use(cors({
    origin: '*', // For development, allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true
  }));

  // Apply rate limiter
  app.use('/api/', limiter);
};

export default securityMiddleware;
