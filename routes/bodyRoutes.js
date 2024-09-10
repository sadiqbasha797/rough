const express = require('express');
const {createBodyPart,getAllBodyParts, getBodyPartById, updateBodyPart, deleteBodyPart} = require('../controllers/bodyController');  // Path to the controller
const router = express.Router();
const {adminAuth} = require('../middleware/adminAuth');

// Define routes
router.post('/body',adminAuth, createBodyPart);  // Create a body part
router.get('/body',adminAuth, getAllBodyParts);  // Get all body parts
router.get('/body/:id',adminAuth, getBodyPartById);  // Get a single body part by ID
router.put('/body/:id',adminAuth, updateBodyPart);  // Update a body part by ID
router.delete('/body/:id',adminAuth, deleteBodyPart);  // Delete a body part by ID

module.exports = router;
