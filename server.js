import mongoose from 'mongoose';
import app from './app.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const MONGO_URI_LOCAL = process.env.MONGO_URI_LOCAL || 'mongodb://localhost:27017/recycle-vision';

const mongooseOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
};

// Atlas is the single source of truth. Retry hard before ever falling back
// to Local, since a brief connection hiccup (not real downtime) was
// previously enough to strand the app on an empty local database.
const ATLAS_RETRY_ATTEMPTS = 5;
const ATLAS_RETRY_DELAY_MS = 4000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectDB = async () => {
  for (let attempt = 1; attempt <= ATLAS_RETRY_ATTEMPTS; attempt++) {
    try {
      await mongoose.connect(MONGO_URI, mongooseOptions);
      console.log(`Connected to MongoDB (Atlas/Primary)`);
      app.listen(PORT, () => {
        console.log(`Server started on port ${PORT}`);
      });
      return;
    } catch (err) {
      console.error(`Atlas connection attempt ${attempt}/${ATLAS_RETRY_ATTEMPTS} failed: ${err.message}`);
      if (attempt < ATLAS_RETRY_ATTEMPTS) await sleep(ATLAS_RETRY_DELAY_MS);
    }
  }

  console.error(`Atlas unreachable after ${ATLAS_RETRY_ATTEMPTS} attempts — falling back to Local. Data written now will NOT be visible once Atlas recovers.`);
  try {
    await mongoose.connect(MONGO_URI_LOCAL, mongooseOptions);
    console.log(`Connected to MongoDB (Local Compass fallback)`);
    app.listen(PORT, () => {
      console.log(`Server started on port ${PORT}`);
    });
  } catch (localErr) {
    console.error(`Local connection also failed:`, localErr);
    process.exit(1);
  }
};

connectDB();
