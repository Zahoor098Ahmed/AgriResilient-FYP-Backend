import express from 'express';
import {
  getAllDetections, getAllUsers, deleteDetection, getStats, deleteUser,
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

// The app-wide default (app.js) caches GET responses for 60s, which meant
// every admin list looked stale for up to a minute after an edit/delete —
// the browser's fetch() was replaying a cached response instead of hitting
// the server, so only a hard refresh (past cache expiry) showed the change.
// Admin data must always be current, so override that here for every route
// in this router.
router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

router.get('/stats', getStats);
router.get('/detections', getAllDetections);
router.delete('/detections/:id', deleteDetection);
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);

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
