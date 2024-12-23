const MoodAssessment = require('../models/moodAssessment');
const AssessmentInfo = require('../models/assessmentInfo');
const mongoose = require('mongoose');

// Create a new mood assessment
async function createMoodAssessment(req, res) {
    try {
        const moodAssessment = new MoodAssessment(req.body);
        await moodAssessment.save();
        res.status(201).json({
            status: 'success',
            body: moodAssessment,
            message: 'Mood assessment created successfully'
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            body: null,
            message: error.message
        });
    }
}

// Get all mood assessments
async function getMoodAssessments(req, res) {
    try {
        const moodAssessments = await MoodAssessment.find();
        res.status(200).json({
            status: 'success',
            body: moodAssessments,
            message: 'Mood assessments retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: error.message
        });
    }
}

// Get a mood assessment by ID
async function getMoodAssessmentById(req, res) {
    try {
        const moodAssessment = await MoodAssessment.findById(req.params.id);
        if (!moodAssessment) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'Mood assessment not found'
            });
        }
        res.status(200).json({
            status: 'success',
            body: moodAssessment,
            message: 'Mood assessment retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: error.message
        });
    }
}

// Update a mood assessment by ID
async function updateMoodAssessment(req, res) {
    try {
        const moodAssessment = await MoodAssessment.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!moodAssessment) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'Mood assessment not found'
            });
        }
        res.status(200).json({
            status: 'success',
            body: moodAssessment,
            message: 'Mood assessment updated successfully'
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            body: null,
            message: error.message
        });
    }
}

// Delete a mood assessment by ID
async function deleteMoodAssessment(req, res) {
    try {
        const moodAssessment = await MoodAssessment.findByIdAndDelete(req.params.id);
        if (!moodAssessment) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'Mood assessment not found'
            });
        }
        res.status(200).json({
            status: 'success',
            body: moodAssessment,
            message: 'Mood assessment deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: error.message
        });
    }
}

// Validate answers and store result in AssessmentInfo
async function validateAndStoreAssessment(req, res) {
    try {
        const { answers } = req.body;
        const patientId = req.patient;
        if (!patientId || !answers || !Array.isArray(answers)) {
            return res.status(400).json({
                status: 'error',
                body: null,
                message: 'Invalid input data'
            });
        }

        let maxMoodLevel = 'low';
        let overallMood = '';

        for (let answer of answers) {
            const { questionId, optionId } = answer;
            
            const question = await MoodAssessment.findById(questionId);
            if (!question) {
                return res.status(404).json({
                    status: 'error',
                    body: null,
                    message: `Question with id ${questionId} not found`
                });
            }

            const selectedOption = question.answer.find(opt => opt._id.toString() === optionId);
            if (!selectedOption) {
                return res.status(404).json({
                    status: 'error',
                    body: null,
                    message: `Option with id ${optionId} not found for question ${questionId}`
                });
            }

            if (selectedOption.moodLevel === 'extreme' || 
               (selectedOption.moodLevel === 'medium' && maxMoodLevel === 'low')) {
                maxMoodLevel = selectedOption.moodLevel;
            }

            overallMood = await getColorName(question.type);
        }

        const assessmentInfo = new AssessmentInfo({
            patientId,
            mood: overallMood,
            moodLevel: maxMoodLevel === 'extreme' ? 'high' : maxMoodLevel
        });

        await assessmentInfo.save();

        res.status(201).json({
            status: 'success',
            body: assessmentInfo,
            message: 'Assessment validated and stored successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: error.message
        });
    }
}

// Helper function to get color name from Color model
async function getColorName(colorId) {
    const Color = mongoose.model('Color');
    const color = await Color.findById(colorId);
    return color ? color.mood : 'Unknown';
}

// Function to fetch questions based on type
async function getQuestionsByType(req, res) {
    try {
        const { type } = req.params;
        const limit = 10;

        const questions = await MoodAssessment.find({ type })
            .limit(limit)
            .select('-answer.moodLevel');

        if (questions.length === 0) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: `No questions found for type: ${type}`
            });
        }

        res.status(200).json({
            status: 'success',
            body: questions,
            message: `Questions of type ${type} retrieved successfully`
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: error.message
        });
    }
}

// Export the controller functions
module.exports = {
    createMoodAssessment,
    getMoodAssessments,
    getMoodAssessmentById,
    updateMoodAssessment,
    deleteMoodAssessment,
    validateAndStoreAssessment,
    getQuestionsByType
};
