import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import PendingSignup from '../models/PendingSignup.js';
import { sendVerificationEmail, sendAdminOtpEmail, sendSignupOtpEmail } from '../utils/email.js';

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

export const signup = async (req, res) => {
  try {
    const { name, email, password, role, gender } = req.body;
    console.log(`[Signup Attempt] Name: ${name}, Email: ${email}, Gender: ${gender}`);

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    const newUser = await User.create({
      name,
      email,
      password,
      gender: gender || 'male',
      role: role || 'user' // Allow setting role for initial setup/admin
    });

    if (!newUser) {
      throw new Error('User creation failed');
    }

    // Don't send token here, user must login manually as per new requirement
    res.status(201).json({
      success: true,
      message: 'Signup successful! Please login to continue.',
      data: {
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          gender: newUser.gender,
          role: newUser.role,
          preferredLanguage: newUser.preferredLanguage
        }
      }
    });
  } catch (error) {
    console.error('[Signup Error]:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// ---------- Email-verified registration (OTP) ----------
// Two steps: registerStart holds the signup in PendingSignup and emails an
// OTP; registerVerify only creates the real User once that code checks out.
// No token is issued here — login stays a separate, required step.

export const registerStart = async (req, res) => {
  try {
    const { name, email, password, gender } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000;

    await PendingSignup.findOneAndUpdate(
      { email },
      { name, email, password, gender: gender || 'male', otp, otpExpires, otpAttempts: 0 },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await sendSignupOtpEmail(email, otp);

    res.status(200).json({
      success: true,
      otpRequired: true,
      message: 'A verification code was sent to your email'
    });
  } catch (error) {
    console.error('[Register Start Error]:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const registerVerify = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const pending = await PendingSignup.findOne({ email });
    if (!pending) {
      return res.status(400).json({ success: false, message: 'No pending signup found — please register again.' });
    }

    if (pending.otpExpires < Date.now()) {
      await PendingSignup.deleteOne({ _id: pending._id });
      return res.status(400).json({ success: false, message: 'Verification code expired — please register again.' });
    }

    if (pending.otp !== otp) {
      pending.otpAttempts += 1;
      if (pending.otpAttempts >= 5) {
        await PendingSignup.deleteOne({ _id: pending._id });
        return res.status(400).json({ success: false, message: 'Too many incorrect attempts — please register again.' });
      }
      await pending.save();
      return res.status(400).json({ success: false, message: 'Incorrect verification code' });
    }

    const newUser = await User.create({
      name: pending.name,
      email: pending.email,
      password: pending.password,
      gender: pending.gender,
      role: 'user'
    });

    await PendingSignup.deleteOne({ _id: pending._id });

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Please login.',
      data: {
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          gender: newUser.gender,
          role: newUser.role,
          preferredLanguage: newUser.preferredLanguage
        }
      }
    });
  } catch (error) {
    console.error('[Register Verify Error]:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const socialLogin = async (req, res) => {
  try {
    const { name, email, provider, providerId } = req.body;

    // 1) Check if user exists with this email
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user if doesn't exist (Social Signup)
      user = await User.create({
        name,
        email,
        password: Math.random().toString(36).slice(-12), // Random password for social users
        role: 'user',
        isSocial: true,
        provider: provider || 'google'
      });
    }

    // Same rule as regular login: admin accounts must go through the
    // OTP-verified /admin flow, never a passwordless social sign-in.
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin accounts must sign in through the Admin Portal (/admin), not social login.'
      });
    }

    // 2) Generate token
    const token = signToken(user._id);

    res.status(200).json({
      success: true,
      token,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          preferredLanguage: user.preferredLanguage
        }
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // 2) Check if user exists && password is correct
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'No account found with this email. It may have been removed by an admin — please create a new account.'
      });
    }

    if (!(await user.comparePassword(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect email or password'
      });
    }

    // Admin accounts must always go through the dedicated OTP-verified
    // /admin login — never the regular site login. Without this check an
    // admin's password alone would grant a full session here, silently
    // skipping 2FA entirely.
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin accounts must sign in through the Admin Portal (/admin), not the regular login.'
      });
    }

    // 3) If everything ok, send token to client
    const token = signToken(user._id);

    res.status(200).json({
      success: true,
      token,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          gender: user.gender,
          role: user.role,
          location: user.location,
          profileImage: user.profileImage,
          preferredLanguage: user.preferredLanguage
        }
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Step 1 of admin login: verify email+password+role, then email a 6-digit
// OTP instead of issuing a token directly. No JWT is handed out here.
export const adminLoginStart = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect email or password'
      });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'This account does not have admin access'
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.adminOtp = otp;
    user.adminOtpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    user.adminOtpAttempts = 0;
    await user.save({ validateBeforeSave: false });

    await sendAdminOtpEmail(user.email, otp);

    res.status(200).json({
      success: true,
      otpRequired: true,
      message: 'A verification code was sent to your email'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Step 2 of admin login: verify the OTP and issue the real JWT. Locks the
// code out after 5 wrong attempts, forcing a fresh login+OTP cycle rather
// than allowing unlimited guesses against a 6-digit space.
export const adminVerifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and verification code'
      });
    }

    const user = await User.findOne({ email, role: 'admin' });

    if (!user || !user.adminOtp || !user.adminOtpExpires || user.adminOtpExpires < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'Verification code is invalid or has expired. Please log in again.'
      });
    }

    if (user.adminOtp !== otp) {
      user.adminOtpAttempts += 1;
      if (user.adminOtpAttempts >= 5) {
        user.adminOtp = undefined;
        user.adminOtpExpires = undefined;
        user.adminOtpAttempts = 0;
        await user.save({ validateBeforeSave: false });
        return res.status(400).json({
          success: false,
          message: 'Too many incorrect attempts. Please log in again to receive a new code.'
        });
      }
      await user.save({ validateBeforeSave: false });
      return res.status(400).json({
        success: false,
        message: `Incorrect verification code (${5 - user.adminOtpAttempts} attempts remaining)`
      });
    }

    user.adminOtp = undefined;
    user.adminOtpExpires = undefined;
    user.adminOtpAttempts = 0;
    await user.save({ validateBeforeSave: false });

    const token = signToken(user._id);

    res.status(200).json({
      success: true,
      token,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          gender: user.gender,
          role: user.role,
          location: user.location,
          profileImage: user.profileImage,
          preferredLanguage: user.preferredLanguage
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const updateMe = async (req, res) => {
  try {
    const { name, gender, city, lat, lon, preferredLanguage } = req.body;
    
    // Create update object
    const updateData = {};
    if (name) updateData.name = name;
    if (gender) updateData.gender = gender;
    if (preferredLanguage) updateData.preferredLanguage = preferredLanguage;
    
    if (city) {
      updateData.location = {
        city,
        lat: lat || undefined,
        lon: lon || undefined
      };
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          gender: updatedUser.gender,
          role: updatedUser.role,
          location: updatedUser.location,
          credits: updatedUser.credits,
          profileImage: updatedUser.profileImage,
          preferredLanguage: updatedUser.preferredLanguage
        }
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const redeemReward = async (req, res) => {
  try {
    const { rewardTitle, cost } = req.body;
    const user = await User.findById(req.user.id);

    if (user.credits < cost) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient credits'
      });
    }

    user.credits -= cost;
    user.redemptions.push({ rewardTitle, cost });
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Reward redeemed successfully!',
      data: {
        credits: user.credits,
        redemptions: user.redemptions
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'There is no user with that email address.'
      });
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Send real/simulated email
    await sendVerificationEmail(user.email, resetToken);

    res.status(200).json({
      success: true,
      message: 'Token sent to email! (Check console for OTP)',
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, token, password } = req.body;

    const user = await User.findOne({
      email,
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token is invalid or has expired'
      });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    const jwtToken = signToken(user._id);

    res.status(200).json({
      success: true,
      token: jwtToken,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          preferredLanguage: user.preferredLanguage
        }
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
