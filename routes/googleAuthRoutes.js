const express = require('express');
const router = express.Router();
const passport = require('passport');
const { generateToken } = require('../controllers/googleAuthController');

// Initiate Google OAuth login
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google OAuth callback
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  async (req, res) => {
    try {
      const token = generateToken(req.user);
      
      // You can customize this based on your frontend requirements
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
      
      // If the patient is new (needs to complete profile)
      if (!req.user.dateOfBirth || !req.user.mobile) {
        res.redirect(`${frontendURL}/complete-profile?token=${token}`);
      } else {
        res.redirect(`${frontendURL}/dashboard?token=${token}`);
      }
    } catch (error) {
      res.redirect('/login?error=authentication_failed');
    }
  }
);

module.exports = router; 