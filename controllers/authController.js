import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendVerificationEmail } from '../utils/email.js';

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
          role: newUser.role
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
          role: user.role
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

    if (!user || !(await user.comparePassword(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect email or password'
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
          profileImage: user.profileImage
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
    const { name, gender, city } = req.body;
    
    // Create update object
    const updateData = {};
    if (name) updateData.name = name;
    if (gender) updateData.gender = gender;
    if (city) updateData.location = { city };

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
          profileImage: updatedUser.profileImage
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
          role: user.role
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
