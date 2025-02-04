const express = require('express');
const router = express.Router();
const {
    createMoodAssessment,
    getMoodAssessments,
    getMoodAssessmentById,
    updateMoodAssessment,
    deleteMoodAssessment
} = require('../controllers/moodAssessmentController');

router.post('/', createMoodAssessment);
router.get('/', getMoodAssessments);
router.get('/:id', getMoodAssessmentById);
router.put('/:id', updateMoodAssessment);
router.delete('/:id', deleteMoodAssessment);

module.exports = router;
