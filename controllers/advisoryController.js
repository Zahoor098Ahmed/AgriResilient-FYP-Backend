import { getCropAdvisory } from '../services/aiService.js';

export const handleCropAdvisory = async (req, res) => {
  try {
    const { cropType, location, language } = req.body;

    if (!cropType) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a crop type'
      });
    }

    const advisory = await getCropAdvisory(cropType, location, language || 'en');

    res.status(200).json({
      success: true,
      data: advisory
    });

  } catch (error) {
    console.error('Advisory Controller Error:', error);
    
    // Since aiService now provides high-quality fallbacks, we should rarely reach here
    // unless there's a serious code error.
    res.status(500).json({
      success: false,
      message: 'Failed to get AI advisory. Please try again later.'
    });
  }
};
