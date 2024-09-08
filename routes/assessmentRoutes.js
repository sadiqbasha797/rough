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
    getBodyAssessments,
    getMoodAssessments,
} = require('../controllers/assessmentController');
const { adminAuth } = require('../middleware/adminAuth');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Public routes
router.get('/', getAllAssessments);
router.get('/:id', getAssessmentById);
router.get('/type/mood', getMoodAssessments);
router.get('/type/body', getBodyAssessments);

// Protected routes
router.post('/create', adminAuth, upload.single('media'), createAssessment);
router.put('/:id', adminAuth, upload.single('media'), updateAssessment);
router.delete('/:id', adminAuth, deleteAssessment);
router.post('/take-assessment', takeAssessment);

module.exports = router;
