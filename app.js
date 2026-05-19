import express from 'express';
import dotenv from 'dotenv';
import compression from 'compression';
import securityMiddleware from './middleware/security.js';
import detectRoutes from './routes/detect.js';
import advisoryRoutes from './routes/advisory.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const app = express();

// Enable Gzip compression
app.use(compression());

// Cache control middleware for API responses
app.use((req, res, next) => {
  // Cache GET requests for 1 minute by default
  if (req.method === 'GET') {
    res.set('Cache-Control', 'public, max-age=60');
  } else {
    res.set('Cache-Control', 'no-store');
  }
  next();
});

// Apply security middleware
securityMiddleware(app);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/advisory', advisoryRoutes);
app.use('/api', detectRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', worker: process.pid });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

export default app;
