import app from "../app.js";
import dotenv from "dotenv";
import { connectDB } from "../lib/db.js";

dotenv.config();

export default async function handler(req, res) {
  await connectDB();
  return app(req, res);
}
