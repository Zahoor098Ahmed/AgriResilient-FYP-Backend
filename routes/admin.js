import express from 'express';
import { getAllDetections, getAllUsers, deleteDetection, getStats } from '../controllers/adminController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all routes after this middleware
router.use(protect);
router.use(restrictTo('admin'));

router.get('/stats', getStats);
router.get('/detections', getAllDetections);
router.delete('/detections/:id', deleteDetection);
router.get('/users', getAllUsers);

export default router;
