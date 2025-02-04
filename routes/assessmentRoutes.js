const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
    createAssessment,
    getAllAssessments,
    getAssessmentById,
    updateAssessment,
    deleteAssessment,
    takeAssessment,

} = require('../controllers/assessmentController');
const { adminAuth } = require('../middleware/adminAuth');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Public routes
router.get('/', getAllAssessments);
router.get('/:id', getAssessmentById);


// Protected routes
router.post('/create',  upload.single('media'), createAssessment);
router.put('/:id',  upload.single('media'), updateAssessment);
router.delete('/:id',  deleteAssessment);
router.post('/take-assessment', takeAssessment);

module.exports = router;
