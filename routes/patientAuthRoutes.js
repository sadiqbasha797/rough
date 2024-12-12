const express = require('express');
const router = express.Router();
const { signup, signin } = require('../controllers/patientAuthController');

// Patient signup route
router.post('/signup', signup);

// Patient sign-in route
router.post('/signin', signin);

module.exports = router; 