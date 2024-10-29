const express = require('express');
const router = express.Router();
const { assistantAuth } = require('../middleware/assistantAuth');
const fileUpload = require('express-fileupload');
const {
    registerAssistant,
    loginAssistant,
    getAssistantProfile,
    updateAssistantName,
    updateAssistantPassword,
    updateAssistantInfo,
    updateAssistantMedia,
    deleteAssistant,
    getAssistantCounts
} = require('../controllers/assistantController');

// Public routes
router.post('/register', registerAssistant);
router.post('/login', loginAssistant);

// Protected routes
router.get('/profile', assistantAuth, getAssistantProfile);
router.patch('/update-name', assistantAuth, updateAssistantName);
router.patch('/update-password', assistantAuth, updateAssistantPassword);
router.patch('/update-info', assistantAuth, updateAssistantInfo);
router.patch('/update-media', assistantAuth, fileUpload(), updateAssistantMedia);
router.delete('/delete', assistantAuth, deleteAssistant);
router.get('/counts',  getAssistantCounts);
module.exports = router; 