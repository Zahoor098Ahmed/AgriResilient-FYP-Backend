import express from 'express';
import { getSiteContent } from '../controllers/contentController.js';

const router = express.Router();

router.get('/:section', getSiteContent);

export default router;
