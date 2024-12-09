const s3Util = require('../utils/s3Util');
const Assessment = require('../models/Assessment');
const multer = require('multer');
const Color = require('../models/Color');  

const storage = multer.memoryStorage(); // Store files in memory for direct upload to S3
const upload = multer({ storage: storage });

// Create an assessment
const createAssessment = async (req, res) => {
    try {
        const { question, answer, type, score, mcqOptions, category, video } = req.body;

        // Handle media upload if a file is present
        let mediaUrl = null;
        if (req.file) {
            const fileExtension = req.file.mimetype.split('/')[1];
            const key = `assessments/${Date.now()}.${fileExtension}`;
            mediaUrl = await s3Util.uploadFile(req.file.buffer, key, req.file.mimetype);
        }

        // Create new assessment
        const newAssessment = new Assessment({
            question,
            media: mediaUrl,
            answer,
            type,
            score,
            category,
            mcqOptions: type === 'mcq' ? mcqOptions : [],
            video: video
        });

        await newAssessment.save();

        res.status(201).json({
            status: 'success',
            body: newAssessment,
            message: 'Assessment created successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'An error occurred while creating the assessment'
        });
    }
};

// Update an assessment
const updateAssessment = async (req, res) => {
    try {
        let mediaUrl = req.body.media;
        
        if (req.file) {
            const assessment = await Assessment.findById(req.params.id);
            if (!assessment) {
                return res.status(404).json({
                    status: 'error',
                    body: null,
                    message: 'Assessment not found'
                });
            }

            // Delete existing media if present
            if (assessment.media) {
                const existingKey = assessment.media.split('/').pop();
                await s3Util.deleteFile(`assessments/${existingKey}`);
            }

            const fileExtension = req.file.mimetype.split('/')[1];
            const key = `assessments/${Date.now()}.${fileExtension}`;
            mediaUrl = await s3Util.uploadFile(req.file.buffer, key, req.file.mimetype);
        }

        const updatedAssessment = await Assessment.findByIdAndUpdate(req.params.id, {
            ...req.body,
            media: mediaUrl
        }, { new: true });

        if (!updatedAssessment) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'Assessment not found'
            });
        }

        res.json({
            status: 'success',
            body: updatedAssessment,
            message: 'Assessment updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'An error occurred while updating the assessment'
        });
    }
};

// Fetch assessment by ID
const getAssessmentById = async (req, res) => {
    try {
        const assessment = await Assessment.findById(req.params.id).populate('category');
        if (!assessment) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'Assessment not found'
            });
        }
        res.json({
            status: 'success',
            body: assessment,
            message: 'Assessment retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'An error occurred while retrieving the assessment'
        });
    }
};

// Delete an assessment
const deleteAssessment = async (req, res) => {
    try {
        const assessment = await Assessment.findById(req.params.id);
        if (!assessment) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'Assessment not found'
            });
        }

        // Delete media from S3 if exists
        if (assessment.media) {
            const existingKey = assessment.media.split('/').pop();
            await s3Util.deleteFile(`assessments/${existingKey}`);
        }

        // Delete the assessment
        await assessment.deleteOne();

        res.json({
            status: 'success',
            body: null,
            message: 'Assessment deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting assessment:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'An error occurred while deleting the assessment'
        });
    }
};
// Get all assessments
const getAllAssessments = async (req, res) => {
    try {
        const assessments = await Assessment.find({}).populate('category');
        res.json({
            status: 'success',
            body: assessments,
            message: 'Assessments retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'An error occurred while retrieving the assessments'
        });
    }
};






const takeAssessment = async (req, res) => {
    try {
        const { answers } = req.body; // answers should be an array of objects { questionId, answer }

        if (!Array.isArray(answers) || answers.length === 0) {
            return res.status(400).json({
                status: 'error',
                body: null,
                message: 'Answers are required'
            });
        }

        const assessments = await Assessment.find({});
        const categories = {};
        let totalScore = 0;
        let correctAnswers = 0;

        for (const answer of answers) {
            const assessment = assessments.find(a => a._id.toString() === answer.questionId);
            if (!assessment) continue;

            if (assessment.type === 'mcq') {
                const correctOption = assessment.mcqOptions.find(option => option.isCorrect);
                if (correctOption && correctOption.text === answer.answer) {  // Fixed: using `text` instead of `optionText`
                    totalScore += assessment.score;
                    correctAnswers++;
                    if (assessment.category) {
                        categories[assessment.category] = (categories[assessment.category] || 0) + 1;
                    }
                }
            } else if (assessment.type === 'blanks') {
                if (assessment.answer === answer.answer) {
                    totalScore += assessment.score;
                    correctAnswers++;
                    if (assessment.category) {
                        categories[assessment.category] = (categories[assessment.category] || 0) + 1;
                    }
                }
            }
        }

        // Find the category with the most correct answers
        const maxCategory = Object.entries(categories).reduce((max, entry) => entry[1] > max[1] ? entry : max, ['', 0])[0];

        // If maxCategory is found, fetch its details from the Color (Mood) model
        let maxCategoryDetails = null;
        if (maxCategory) {
            maxCategoryDetails = await Color.findById(maxCategory);
        }

        res.json({
            status: 'success',
            body: {
                totalScore,
                correctAnswers,
                mood: maxCategoryDetails // Return the mood details (body of the category)
            },
            message: 'Assessment taken successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'An error occurred while taking the assessment'
        });
    }
};




module.exports = {
    createAssessment,
    getAllAssessments,
    getAssessmentById,
    updateAssessment,
    deleteAssessment,
    takeAssessment,
   
};
