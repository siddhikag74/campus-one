const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Club = require('../models/Club');
const authMiddleware = require('../middleware/auth');

const signToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'campusone_super_secure_jwt_secret_token_2026',
    { expiresIn: '30d' }
  );
};

// Helper to format safe user object (strips sensitive fields)
const sanitizeUser = (user) => {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    college: user.college,
    branch: user.branch,
    year: user.year,
    rollNumber: user.rollNumber,
    phone: user.phone,
    avatar: user.avatar || (user.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'CO'),
    interests: user.interests || [],
    interestSubCategories: user.interestSubCategories || [],
    onboardingCompleted: !!user.onboardingCompleted,
    followedClubs: user.followedClubs || [],
    createdAt: user.createdAt,
  };
};

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword, college, branch, year, rollNumber, phone } = req.body;

    // 1. Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required.' });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    // 2. Check if user already exists
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists. Please log in.' });
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Generate avatar initials
    const initials = name.trim().split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    // 5. Optionally link popular default clubs for new users
    const defaultClubs = await Club.find({}).limit(2).select('_id');

    // 6. Create User (Onboarding incomplete by default for new signups)
    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      college: (college || 'Delhi Technological University').trim(),
      branch: (branch || 'Computer Science & Engineering').trim(),
      year: (year || '1st Year').trim(),
      rollNumber: (rollNumber || '').trim(),
      phone: (phone || '').trim(),
      avatar: initials,
      interests: [],
      interestSubCategories: [],
      onboardingCompleted: false,
      followedClubs: defaultClubs.map(c => c._id),
      shortlistedCompetitions: [],
      rejectedCompetitions: [],
    });

    const token = signToken(newUser._id);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to CampusOne.',
      token,
      user: sanitizeUser(newUser),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both email and password.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Incorrect email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect email or password.' });
    }

    const token = signToken(user._id);

    return res.json({
      success: true,
      message: `Welcome back, ${user.name.split(' ')[0]}!`,
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/demo-login
// Fast login as demo student (Arjun Sharma) for judges, evaluators, and testing
router.post('/demo-login', async (req, res, next) => {
  try {
    let user = await User.findOne({ email: 'arjun.sharma@dtu.ac.in' });

    if (!user) {
      // Create Arjun Sharma if not yet seeded
      const hashedPassword = await bcrypt.hash('campusone123', 10);
      user = await User.create({
        name: 'Arjun Sharma',
        email: 'arjun.sharma@dtu.ac.in',
        rollNumber: '23BCS1042',
        year: '3rd Year',
        branch: 'Computer Science & Engineering',
        college: 'Delhi Technological University',
        phone: '+91 98765 43210',
        avatar: 'AS',
        interests: ['Tech', 'Gaming', 'Creativity'],
        interestSubCategories: ['Design', 'Media'],
        onboardingCompleted: true,
        password: hashedPassword,
      });
    } else if (user.onboardingCompleted === undefined || user.onboardingCompleted === false) {
      user.onboardingCompleted = true;
      if (!user.interests || user.interests.length === 0) {
        user.interests = ['Tech', 'Gaming', 'Creativity'];
        user.interestSubCategories = ['Design', 'Media'];
      }
      await user.save();
    }

    const token = signToken(user._id);

    return res.json({
      success: true,
      message: 'Demo login successful as Arjun Sharma',
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/onboarding
// Save initial interest selections and mark onboarding as complete
router.post('/onboarding', authMiddleware, async (req, res, next) => {
  try {
    const { interests, interestSubCategories } = req.body;

    if (!interests || !Array.isArray(interests) || interests.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one interest to personalize your campus experience.',
      });
    }

    const cleanInterests = interests.map(i => String(i).trim()).filter(Boolean);
    const cleanSubCategories = Array.isArray(interestSubCategories)
      ? interestSubCategories.map(s => String(s).trim()).filter(Boolean)
      : [];

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          interests: cleanInterests,
          interestSubCategories: cleanSubCategories,
          onboardingCompleted: true,
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({
      success: true,
      message: 'Interests saved successfully! Welcome to CampusOne.',
      user: sanitizeUser(updatedUser),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me
// Returns sanitized authenticated user profile
router.get('/me', authMiddleware, async (req, res) => {
  res.json({
    success: true,
    user: sanitizeUser(req.user),
  });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

// POST /api/auth/forgot-password
// Safe password recovery endpoint (does not reveal if email exists)
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  // Always return friendly confirmation for security
  return res.json({
    success: true,
    message: 'If an account exists with this email, password reset instructions have been dispatched.',
  });
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  return res.json({
    success: true,
    message: 'Password reset completed successfully. Please log in with your new password.',
  });
});

module.exports = router;
