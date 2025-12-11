const express = require('express');
const router = express.Router();
const { 
    signup, 
    login, 
    forgotPassword, 
    resetPassword 
} = require('../controllers/authController');

// Register the routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword); // <--- This fixes your error
router.post('/reset-password', resetPassword);

module.exports = router;