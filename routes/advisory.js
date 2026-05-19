import express from 'express';
import { handleCropAdvisory } from '../controllers/advisoryController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/advisory
// Protected: Only logged in users can get AI advice
router.post('/', protect, handleCropAdvisory);

export default router;
