import mongoose from 'mongoose';

const detectionSchema = new mongoose.Schema({
  imageOriginalName: {
    type: String,
    required: true
  },
  detectedObject: {
    type: String,
    required: true
  },
  recyclables: {
    type: [String],
    required: true
  },
  confidence: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Detection = mongoose.model('Detection', detectionSchema);

export default Detection;
