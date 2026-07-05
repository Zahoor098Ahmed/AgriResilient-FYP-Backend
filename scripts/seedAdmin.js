import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const seedAdmin = async () => {
  try {
    // Connect to database
    const MONGO_URI = process.env.MONGO_URI || process.env.MONGO_URI_LOCAL || 'mongodb://localhost:27017/recycle-vision';
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to database');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@agriresilient.com' });
    if (existingAdmin) {
      console.log('ℹ️  Admin already exists with email: admin@agriresilient.com');
      process.exit(0);
    }

    // Create admin user
    const admin = new User({
      name: 'Admin User',
      email: 'admin@agriresilient.com',
      password: 'admin123', // You can change this later
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
    console.log('📧 Email: admin@agriresilient.com');
    console.log('🔑 Password: admin123');
    console.log('⚠️  Please change the password immediately after first login!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
};

seedAdmin();
