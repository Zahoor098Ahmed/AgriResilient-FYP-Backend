import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const seedAdmin = async () => {
  try {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
      console.error('❌ Set ADMIN_EMAIL and ADMIN_PASSWORD in .env before running this script.');
      process.exit(1);
    }

    // Connect to database
    const MONGO_URI = process.env.MONGO_URI || process.env.MONGO_URI_LOCAL || 'mongodb://localhost:27017/recycle-vision';
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to database');

    // If a user with this email already exists, promote them to admin and
    // update their password rather than failing on the unique-email
    // constraint or leaving a stale non-admin account behind.
    const existing = await User.findOne({ email });
    if (existing) {
      existing.role = 'admin';
      existing.password = password;
      await existing.save();
      console.log(`✅ Existing user promoted to admin: ${email}`);
      process.exit(0);
    }

    const admin = new User({
      name: 'Admin User',
      email,
      password,
      role: 'admin',
      gender: 'other',
      preferredLanguage: 'en',
      credits: 0,
      location: {
        city: 'Karachi',
        lat: 24.8607,
        lon: 67.0011
      }
    });

    await admin.save();
    console.log('✅ Admin user created successfully!');
    console.log(`📧 Email: ${email}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
};

seedAdmin();
