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

    // Call AI service
    const aiResult = await detectObject(req.file.buffer);

    // Save to database
    const newDetection = new Detection({
      imageOriginalName: req.file.originalname,
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
      confidence: aiResult.confidence,
      savedId: savedDetection._id
    });

  } catch (error) {
    console.error('Detection Error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during object detection'
    });
  }
};
