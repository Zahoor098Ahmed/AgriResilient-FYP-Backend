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
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  };

  // Atlas is the single source of truth — every worker MUST land on the
  // same database, or requests silently split across two different data
  // sets depending on which worker handles them. Retry hard before ever
  // falling back to Local, since a brief connection hiccup (not real
  // downtime) was previously enough to strand a worker on an empty local
  // database while its siblings stayed on Atlas.
  const ATLAS_RETRY_ATTEMPTS = 5;
  const ATLAS_RETRY_DELAY_MS = 4000;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const connectDB = async () => {
    for (let attempt = 1; attempt <= ATLAS_RETRY_ATTEMPTS; attempt++) {
      try {
        await mongoose.connect(MONGO_URI, mongooseOptions);
        console.log(`[Worker ${process.pid}] Connected to MongoDB (Atlas/Primary)`);
        app.listen(PORT, () => {
          console.log(`[Worker ${process.pid}] Server started on port ${PORT}`);
        });
        return;
      } catch (err) {
        console.error(`[Worker ${process.pid}] Atlas connection attempt ${attempt}/${ATLAS_RETRY_ATTEMPTS} failed: ${err.message}`);
        if (attempt < ATLAS_RETRY_ATTEMPTS) await sleep(ATLAS_RETRY_DELAY_MS);
      }
    }

    console.error(`[Worker ${process.pid}] Atlas unreachable after ${ATLAS_RETRY_ATTEMPTS} attempts — falling back to Local. Data written now will NOT be visible once Atlas recovers.`);
    try {
      await mongoose.connect(MONGO_URI_LOCAL, mongooseOptions);
      console.log(`[Worker ${process.pid}] Connected to MongoDB (Local Compass fallback)`);
      app.listen(PORT, () => {
        console.log(`[Worker ${process.pid}] Server started on port ${PORT}`);
      });
    } catch (localErr) {
      console.error(`[Worker ${process.pid}] Local connection also failed:`, localErr);
      process.exit(1);
    }
  };

  connectDB();
}
