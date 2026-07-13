import mongoose from "mongoose";
import app from "./app.js";
import dotenv from "dotenv";

dotenv.config();

console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("PORT:", process.env.PORT);
console.log("MONGO_URI exists:", !!process.env.MONGO_URI);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ ERROR: MONGO_URI environment variable is missing!");
  process.exit(1);
}

const mongooseOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
};

async function startServer() {
  try {
    await mongoose.connect(MONGO_URI, mongooseOptions);

    console.log("✅ Connected to MongoDB");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ MongoDB Connection Error:");
    console.error(err);
    process.exit(1);
  }
}

startServer();