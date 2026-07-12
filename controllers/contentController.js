import SiteContent from '../models/SiteContent.js';

export const getSiteContent = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const { section } = req.params;
    if (!['about', 'footer', 'home'].includes(section)) {
      return res.status(400).json({ success: false, message: 'Invalid content section' });
    }

    const content = await SiteContent.findOne({ section });

    // No admin edit yet — frontend falls back to its own hardcoded copy.
    if (!content) {
      return res.status(200).json({ success: true, data: null });
    }

    res.status(200).json({ success: true, data: content });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
