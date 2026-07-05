import Detection from '../models/Detection.js';
import { detectObject } from '../services/aiService.js';

export const handleDetection = async (req, res) => {
  try {
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    // Get language from query or body
    const language = req.query.lang || req.body.language || 'en';

    // Use the user's profile location so suggested markets/recycling
    // centers are actually near them, not generic far-away cities.
    const userLocation = req.user.location?.city || null;

    // Call AI service
    const aiResult = await detectObject(req.file.buffer, language, req.file.mimetype, userLocation);

    // If detection was skipped or failed but didn't throw (shouldn't happen with new logic but safe to keep)
    if (!aiResult || aiResult.detected === "Analysis Failed") {
      return res.status(503).json({
        success: false,
        message: 'AI analysis is currently unavailable. Please try again.'
      });
    }

    // Save to database
    const newDetection = new Detection({
      imageOriginalName: req.file.originalname,
      userId: req.user.id,
      detectedObject: aiResult.detected,
      recyclables: aiResult.recyclables,
      confidence: aiResult.confidence
    });

    const savedDetection = await newDetection.save();

    // Log for cluster tracking (handled in server.js but good to have here too)
    console.log(`[Worker ${process.pid}] Processed detection for: ${aiResult.detected}`);

    res.status(200).json({
      success: true,
      detected: aiResult.detected,
      recyclables: aiResult.recyclables,
      nearbyCenters: aiResult.nearbyCenters || [],
      confidence: aiResult.confidence,
      savedId: savedDetection._id
    });

  } catch (error) {
    console.error('Detection Error:', error);
    
    // Fallback is already handled inside detectObject in aiService.js
    // We only reach here if something unexpected happens.
    res.status(500).json({
      success: false,
      message: 'An error occurred during object detection'
    });
  }
};

export const getMyDetections = async (req, res) => {
  try {
    const detections = await Detection.find({ userId: req.user.id }).sort('-createdAt');
    res.status(200).json({
      success: true,
      count: detections.length,
      data: { detections }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

