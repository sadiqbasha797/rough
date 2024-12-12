const express = require('express');
const router = express.Router();
const {
    createBodyAssessment,
    getAllBodyAssessments,
    getBodyAssessmentById,
    updateBodyAssessment,
    deleteBodyAssessment,
    getBodyAssessmentsByCategory,
    takeBodyAssessment,
    getQuestionsByPart,
    getQuestionsByParts
} = require('../controllers/BodyAssessmentController');
router.post('/bodytest', createBodyAssessment);
router.get('/bodytest', getAllBodyAssessments);
router.get('/bodytest/:id', getBodyAssessmentById);
router.put('/bodytest/:id', updateBodyAssessment);
router.delete('/bodytest/:id', deleteBodyAssessment);
router.get('/bodytest/category/:categoryId', getBodyAssessmentsByCategory);
router.post('/bodytest/take', takeBodyAssessment);
router.get('/questions/:partId', getQuestionsByPart);
router.post('/questions-by-parts', getQuestionsByParts);

module.exports = router;
