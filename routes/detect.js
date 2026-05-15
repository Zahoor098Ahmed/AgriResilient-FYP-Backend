import express from 'express';
import { body, validationResult } from 'express-validator';
import upload from '../middleware/upload.js';
import { handleDetection } from '../controllers/detectController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Middleware to handle validation results
const validate = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No image file provided'
    });
  }
  next();
};

// POST /api/detect
// Accepts: multipart/form-data with field "image"
// Protected: Only logged in users can scan
router.post('/detect', protect, upload.single('image'), validate, handleDetection);

export default router;
