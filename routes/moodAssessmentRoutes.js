const express = require('express');
const router = express.Router();
const {
    createMoodAssessment,
    getMoodAssessments,
    getMoodAssessmentById,
    updateMoodAssessment,
    deleteMoodAssessment
} = require('../controllers/moodAssessmentController');

// Create a new mood assessment
router.post('/', createMoodAssessment);

// Get all mood assessments
router.get('/', getMoodAssessments);

// Get a mood assessment by ID
router.get('/:id', getMoodAssessmentById);

// Update a mood assessment by ID
router.put('/:id', updateMoodAssessment);

// Delete a mood assessment by ID
router.delete('/:id', deleteMoodAssessment);

module.exports = router;
