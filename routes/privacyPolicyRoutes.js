const express = require('express');
const router = express.Router();
const { createPrivacyPolicy, updatePrivacyPolicy, getPrivacyPolicy,updatePrivacy } = require('../controllers/privacyController');
const {adminAuth} = require('../middleware/adminAuth');
const {patientProtect} = require('../middleware/auth');
// Create a new privacy policy (Admin only)
router.post('/create', adminAuth, createPrivacyPolicy);

// Update an existing privacy policy (Admin only)
router.put('/update/:id', adminAuth, updatePrivacyPolicy);

// Get the latest privacy policy
router.get('/latest', getPrivacyPolicy);
router.put('/update-privacy', patientProtect, updatePrivacy);

module.exports = router;
