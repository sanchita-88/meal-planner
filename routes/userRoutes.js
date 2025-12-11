const express = require('express');
const router = express.Router();
const { recordFeedback, getUserProfile } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.post('/feedback', protect, recordFeedback);
router.get('/profile', protect, getUserProfile);

module.exports = router;