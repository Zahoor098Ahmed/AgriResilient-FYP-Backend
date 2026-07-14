import dotenv from "dotenv";
import app from "../app.js";
import { connectDB } from "../lib/db.js";

dotenv.config();

export default async function handler(req, res) {
  try {
    await connectDB();
    return app(req, res);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
}