const express = require('express');
const {
  createRequest,
  getRequests,
  updateRequest,
  cancelRequest
} = require('../controllers/requestController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.route('/')
  .get(getRequests)
  .post(createRequest);
router.route('/:id')
  .patch(updateRequest)
  .delete(cancelRequest);

module.exports = router;
