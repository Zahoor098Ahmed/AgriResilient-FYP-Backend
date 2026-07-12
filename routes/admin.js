import express from 'express';
import {
  getAllDetections, getAllUsers, deleteDetection, getStats,
  getContactSubmissions, updateContactStatus, deleteContactSubmission,
  getAllBlogPostsAdmin, createBlogPost, updateBlogPost, deleteBlogPost,
  getSiteContentAdmin, updateSiteContent, uploadImage
} from '../controllers/adminController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import uploadToDisk from '../middleware/uploadToDisk.js';

const router = express.Router();

// Protect all routes after this middleware
router.use(protect);
router.use(restrictTo('admin'));

router.get('/stats', getStats);
router.get('/detections', getAllDetections);
router.delete('/detections/:id', deleteDetection);
router.get('/users', getAllUsers);

router.get('/contact', getContactSubmissions);
router.patch('/contact/:id', updateContactStatus);
router.delete('/contact/:id', deleteContactSubmission);

router.get('/blog', getAllBlogPostsAdmin);
router.post('/blog', createBlogPost);
router.put('/blog/:id', updateBlogPost);
router.delete('/blog/:id', deleteBlogPost);

router.get('/content/:section', getSiteContentAdmin);
router.put('/content/:section', updateSiteContent);

router.post('/upload', uploadToDisk.single('image'), uploadImage);

export default router;
