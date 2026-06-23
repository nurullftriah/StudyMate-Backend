const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const normalizeInterests = require('../utils/normalizeInterests');

function createToken(userId) {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'studymate_dev_secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

const register = asyncHandler(async (req, res) => {
  const {
    name,
    username,
    email,
    password,
    confirmPassword,
    university,
    studyProgram,
    interests,
    skillLevel,
    bio
  } = req.body;

  if (!name || !username || !email || !password) {
    res.status(400);
    throw new Error('Nama, username, email, dan password wajib diisi');
  }

  if (confirmPassword && password !== confirmPassword) {
    res.status(400);
    throw new Error('Konfirmasi password tidak sama');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    username,
    email,
    password: hashedPassword,
    university,
    studyProgram,
    interests: normalizeInterests(interests),
    skillLevel,
    bio
  });

  res.status(201).json({
    token: createToken(user._id),
    user: user.toSafeJSON()
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Email dan password wajib diisi');
  }

  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password');

  if (!user) {
    res.status(401);
    throw new Error('Email atau password salah');
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    res.status(401);
    throw new Error('Email atau password salah');
  }

  res.json({
    token: createToken(user._id),
    user: user.toSafeJSON()
  });
});

const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user.toSafeJSON() });
});

module.exports = {
  register,
  login,
  me
};
