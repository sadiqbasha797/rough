const express = require('express');
const {createBodyPart,getAllBodyParts, getBodyPartById, updateBodyPart, deleteBodyPart} = require('../controllers/bodyController');  // Path to the controller
const router = express.Router();
const {adminAuth} = require('../middleware/adminAuth');

// Define routes
router.post('/body',adminAuth, createBodyPart);  // Create a body part
router.get('/body', getAllBodyParts);  // Get all body parts
router.get('/body/:id', getBodyPartById);  // Get a single body part by ID
router.put('/body/:id', updateBodyPart);  // Update a body part by ID
router.delete('/body/:id', deleteBodyPart);  // Delete a body part by ID

module.exports = router;
