import mongoose from 'mongoose';

// Holds a registration in progress until the user verifies their email OTP.
// Nothing here becomes a real User until registerVerify succeeds — that's
// the point: half-finished signups never occupy the email address. The TTL
// index auto-deletes abandoned attempts (and their plaintext password) 15
// minutes after creation.
const pendingSignupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    default: 'male'
  },
  otp: { type: String, required: true },
  otpExpires: { type: Date, required: true },
  otpAttempts: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now, expires: 900 } // 15 minutes
});

const PendingSignup = mongoose.model('PendingSignup', pendingSignupSchema);

export default PendingSignup;
