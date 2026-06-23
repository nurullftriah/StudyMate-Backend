const express = require('express');
const {
  getProfile,
  updateProfile,
  listPartners,
  getDashboard,
  getUserById
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.get('/me', getProfile);
router.put('/me', updateProfile);
router.get('/dashboard', getDashboard);
router.get('/partners', listPartners);
router.get('/:id', getUserById);

module.exports = router;
