import mongoose from 'mongoose';

// Caches AI crop-advisory results by crop+location+language so the same
// request never burns AI tokens twice, even across server restarts.
const advisoryCacheSchema = new mongoose.Schema({
  cropType: {
    type: String,
    required: true
  },
  location: {
    type: String,
    default: null
  },
  language: {
    type: String,
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

advisoryCacheSchema.index({ cropType: 1, location: 1, language: 1 }, { unique: true });

const AdvisoryCache = mongoose.model('AdvisoryCache', advisoryCacheSchema);

export default AdvisoryCache;
