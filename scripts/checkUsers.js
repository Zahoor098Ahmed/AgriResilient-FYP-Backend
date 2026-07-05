import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const checkUsers = async () => {
  try {
    // Connect to database
    const MONGO_URI = process.env.MONGO_URI || process.env.MONGO_URI_LOCAL || 'mongodb://localhost:27017/recycle-vision';
    console.log(`🔗 Connecting to: ${MONGO_URI}`);
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to database');

    // Get all users
    const users = await User.find().select('-password');
    console.log(`\n👥 Total users in database: ${users.length}`);

    if (users.length === 0) {
      console.log('\n❌ No users found! Please run "npm run seed-admin" to create an admin user.');
    } else {
      console.log('\n📋 Users list:');
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. Name: ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Created: ${user.createdAt}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkUsers();
