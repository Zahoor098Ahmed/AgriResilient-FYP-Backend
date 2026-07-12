import express from 'express';
import { getPublishedBlogPosts } from '../controllers/blogController.js';

const router = express.Router();

router.get('/', getPublishedBlogPosts);

export default router;
