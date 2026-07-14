import mongoose from 'mongoose';

// Vercel functions can run "warm" and get reused across requests. Without
// caching, every invocation would open a fresh MongoDB connection and
// exhaust Atlas's connection limit within minutes.
const cached = global._mongooseCache || (global._mongooseCache = { conn: null, promise: null });

export function connectDB() {
  if (cached.conn) return cached.promise;

  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    throw new Error('MONGO_URI environment variable is missing');
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    }).then((m) => {
      cached.conn = m;
      return m;
    });
  }

  return cached.promise;
}
