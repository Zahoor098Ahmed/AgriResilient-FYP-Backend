import express from 'express';
import { handleChat } from '../controllers/chatController.js';

const router = express.Router();

// POST /api/chat
// Public: the chat widget is available to guests too, matching its
// existing unrestricted visibility across the app.
router.post('/', handleChat);

export default router;
