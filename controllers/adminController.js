import Detection from '../models/Detection.js';
import User from '../models/User.js';

export const getAllDetections = async (req, res) => {
  try {
    const detections = await Detection.find().sort('-createdAt');
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

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort('-createdAt');
    res.status(200).json({
      success: true,
      count: users.length,
      data: { users }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const deleteDetection = async (req, res) => {
  try {
    await Detection.findByIdAndDelete(req.params.id);
    res.status(204).json({
      success: true,
      data: null
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const getStats = async (req, res) => {
  try {
    const totalDetections = await Detection.countDocuments();
    const totalUsers = await User.countDocuments();
    
    // Simple aggregation for most common objects
    const commonObjects = await Detection.aggregate([
      { $group: { _id: '$detectedObject', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalDetections,
        totalUsers,
        commonObjects
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
