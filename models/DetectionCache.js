import mongoose from 'mongoose';

// Caches AI detection results by image content hash so the exact same photo
// never burns AI tokens twice — a repeat upload (or another user uploading
// the same image) is served straight from the database.
const detectionCacheSchema = new mongoose.Schema({
  imageHash: {
    type: String,
    required: true
  },
  language: {
    type: String,
    required: true
  },
  userLocation: {
    type: String,
    default: null
  },
  isValid: {
    type: Boolean,
    default: true
  },
  detected: {
    type: String,
    required: true
  },
  recyclables: [
    {
      itemType: String,
      potential: String,
      value: String,
      description: String
    }
  ],
  nearbyCenters: [
    {
      name: String,
      type: String
    }
  ],
  confidence: {
    type: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

detectionCacheSchema.index({ imageHash: 1, language: 1, userLocation: 1 }, { unique: true });

const DetectionCache = mongoose.model('DetectionCache', detectionCacheSchema);

export default DetectionCache;
