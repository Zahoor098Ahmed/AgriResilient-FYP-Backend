import mongoose from 'mongoose';

const detectionSchema = new mongoose.Schema({
  imageOriginalName: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  detectedObject: {
    type: String,
    required: true
  },
  recyclables: [
    {
      itemType: {
        type: String
      },
      potential: String,
      value: String,
      description: String
    }
  ],
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
