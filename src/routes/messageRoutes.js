const express = require('express');
const {
  getConversations,
  getMessages,
  sendMessage
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.get('/conversations', getConversations);
router.route('/:partnerId')
  .get(getMessages)
  .post(sendMessage);

module.exports = router;
