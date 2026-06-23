const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.split(' ')[1] : null;

  if (!token) {
    res.status(401);
    throw new Error('Token tidak ditemukan. Silakan login terlebih dahulu.');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'studymate_dev_secret');
    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(401);
      throw new Error('Pengguna tidak ditemukan.');
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401);
    throw new Error('Token tidak valid atau sudah kedaluwarsa.');
  }
});

module.exports = { protect };
