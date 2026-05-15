import cluster from 'cluster';
import os from 'os';
import mongoose from 'mongoose';
import app from './app.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/recycle-vision';

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
    maxPoolSize: 10, // Maintain up to 10 socket connections
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  };

  mongoose.connect(MONGO_URI, mongooseOptions)
    .then(() => {
      console.log(`[Worker ${process.pid}] Connected to MongoDB`);
      app.listen(PORT, () => {
        console.log(`[Worker ${process.pid}] Server started on port ${PORT}`);
      });
    })
    .catch(err => {
      console.error(`[Worker ${process.pid}] MongoDB connection error:`, err);
      process.exit(1);
    });
}
