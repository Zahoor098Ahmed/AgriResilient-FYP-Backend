import cluster from 'cluster';
import os from 'os';
import mongoose from 'mongoose';
import app from './app.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const MONGO_URI_LOCAL = process.env.MONGO_URI_LOCAL || 'mongodb://localhost:27017/recycle-vision';

if (cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  console.log(`Primary ${process.pid} is running`);
  console.log(`Forking ${numCPUs} workers...`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died. Forking a new one...`);
    cluster.fork();
  });
} else {
  // Workers can share any TCP connection
  // In this case it is an HTTP server
  const mongooseOptions = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  const connectDB = async () => {
    try {
      // Try primary URI (Atlas)
      await mongoose.connect(MONGO_URI, mongooseOptions);
      console.log(`[Worker ${process.pid}] Connected to MongoDB (Atlas/Primary)`);
    } catch (err) {
      console.error(`[Worker ${process.pid}] Atlas connection failed, trying Local...`);
      try {
        // Fallback to Local
        await mongoose.connect(MONGO_URI_LOCAL, mongooseOptions);
        console.log(`[Worker ${process.pid}] Connected to MongoDB (Local Compass)`);
      } catch (localErr) {
        console.error(`[Worker ${process.pid}] Local connection also failed:`, localErr);
        process.exit(1);
      }
    }

    app.listen(PORT, () => {
      console.log(`[Worker ${process.pid}] Server started on port ${PORT}`);
    });
  };

  connectDB();
}
