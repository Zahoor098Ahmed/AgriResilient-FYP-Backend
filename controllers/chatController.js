import { getChatReply } from '../services/aiService.js';

export const handleChat = async (req, res) => {
  try {
    const { message, language, history } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a message'
      });
    }

    const reply = await getChatReply(
      message.trim().slice(0, 1000),
      Array.isArray(history) ? history.slice(-6) : [],
      language || 'en'
    );

    res.status(200).json({
      success: true,
      reply
    });
  } catch (error) {
    console.error('Chat Controller Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get a reply. Please try again.'
    });
  }
};
