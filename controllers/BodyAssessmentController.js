const BodyAssessment = require('../models/BodyAssessment');  
const Color = require('../models/Color');  

// Create a body assessment
const createBodyAssessment = async (req, res) => {
    try {
        const { question, answer, type, score, mcqOptions, part } = req.body;

        // Ensure mcqOptions have the required structure with a color reference
        const formattedMcqOptions = mcqOptions.map(option => ({
            text: option.text,
            color: option.color
        }));

        const newBodyAssessment = new BodyAssessment({
            question,
            answer,
            type,
            score,
            part,
            mcqOptions: type === 'mcq' ? formattedMcqOptions : []
        });

        await newBodyAssessment.save();

        res.status(201).json({
            status: 'success',
            body: newBodyAssessment,
            message: 'Body Assessment created successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'An error occurred while creating the body assessment'
        });
    }
};

// Update a body assessment
const updateBodyAssessment = async (req, res) => {
    try {
        const { mcqOptions, ...restBody } = req.body;

        // Format mcqOptions with color reference if provided
        const formattedMcqOptions = mcqOptions
            ? mcqOptions.map(option => ({
                text: option.text,
                color: option.color
            }))
            : undefined;

        const updatedData = { ...restBody };
        if (formattedMcqOptions) {
            updatedData.mcqOptions = formattedMcqOptions;
        }

        const updatedBodyAssessment = await BodyAssessment.findByIdAndUpdate(req.params.id, updatedData, { new: true });

        if (!updatedBodyAssessment) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'Body Assessment not found'
            });
        }

        res.json({
            status: 'success',
            body: updatedBodyAssessment,
            message: 'Body Assessment updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'An error occurred while updating the body assessment'
        });
    }
};


// Fetch body assessment by ID
const getBodyAssessmentById = async (req, res) => {
    try {
        const bodyAssessment = await BodyAssessment.findById(req.params.id);
        if (!bodyAssessment) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'Body Assessment not found'
            });
        }
        res.json({
            status: 'success',
            body: bodyAssessment,
            message: 'Body Assessment retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'An error occurred while retrieving the body assessment'
        });
    }
};

// Delete a body assessment
const deleteBodyAssessment = async (req, res) => {
    try {
        const bodyAssessment = await BodyAssessment.findById(req.params.id);
        if (!bodyAssessment) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'Body Assessment not found'
            });
        }

        // Delete the body assessment
        await bodyAssessment.deleteOne();

        res.json({
            status: 'success',
            body: null,
            message: 'Body Assessment deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting body assessment:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'An error occurred while deleting the body assessment'
        });
    }
};

// Get all body assessments
const getAllBodyAssessments = async (req, res) => {
    try {
        const bodyAssessments = await BodyAssessment.find({});
        res.json({
            status: 'success',
            body: bodyAssessments,
            message: 'Body Assessments retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'An error occurred while retrieving the body assessments'
        });
    }
};

// Example endpoint to fetch body assessments based on category
const getBodyAssessmentsByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const bodyAssessments = await BodyAssessment.find({ category: categoryId });
        if (!bodyAssessments.length) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'No body assessments found for this category'
            });
        }
        res.json({
            status: 'success',
            body: bodyAssessments,
            message: 'Body Assessments retrieved successfully by category'
        });
    } catch (error) {
        console.error('Error fetching body assessments by category:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'An error occurred while retrieving body assessments by category'
        });
    }
};


// Fetch questions based on part
const getQuestionsByPart = async (req, res) => {
    try {
        const { partId } = req.params;

        // Validate partId
        if (!partId) {
            return res.status(400).json({
                status: 'error',
                body: null,
                message: 'Part ID is required'
            });
        }

        // Find questions based on the part ID
        const questions = await BodyAssessment.find({ part: partId });

        if (!questions.length) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'No questions found for the given part'
            });
        }

        res.json({
            status: 'success',
            body: questions,
            message: 'Questions retrieved successfully'
        });
    } catch (error) {
        console.error('Error fetching questions by part:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'An error occurred while fetching questions'
        });
    }
};

// Fetch questions based on part(s)
const getQuestionsByParts = async (req, res) => {
    try {
        const { partIds } = req.body; // partIds should be an array of part IDs

        // Validate partIds
        if (!Array.isArray(partIds) || partIds.length === 0) {
            return res.status(400).json({
                status: 'error',
                body: null,
                message: 'Part IDs are required and should be an array'
            });
        }

        // Find questions that match any of the part IDs
        const questions = await BodyAssessment.find({ part: { $in: partIds } });

        if (!questions.length) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'No questions found for the given parts'
            });
        }

        res.json({
            status: 'success',
            body: questions,
            message: 'Questions retrieved successfully'
        });
    } catch (error) {
        console.error('Error fetching questions by parts:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'An error occurred while fetching questions'
        });
    }
};

// Take a Body Assessment
const takeBodyAssessment = async (req, res) => {
    try {
        const { answers } = req.body; // answers should be an array of objects { questionId, answer }

        if (!Array.isArray(answers) || answers.length === 0) {
            return res.status(400).json({
                status: 'error',
                body: null,
                message: 'Answers are required'
            });
        }

        const assessments = await BodyAssessment.find({}).populate('mcqOptions.color'); // Populate color for mcqOptions
        const colorTally = {};
        let totalScore = 0;
        let correctAnswers = 0;

        for (const answer of answers) {
            const assessment = assessments.find(a => a._id.toString() === answer.questionId);
            if (!assessment) continue;

            if (assessment.type === 'mcq') {
                const selectedOption = assessment.mcqOptions.find(option => option.text === answer.answer);
                if (selectedOption) {
                    totalScore += assessment.score; // Since all options are correct, add score for any selection
                    correctAnswers++;

                    // Track the color frequency in the answers
                    const colorId = selectedOption.color._id.toString();
                    colorTally[colorId] = (colorTally[colorId] || 0) + 1;
                }
            } else if (assessment.type === 'blanks') {
                if (assessment.answer === answer.answer) {
                    totalScore += assessment.score;
                    correctAnswers++;
                }
            }
        }

        // Find the most selected color (max category)
        const maxCategoryId = Object.entries(colorTally).reduce((max, entry) => entry[1] > max[1] ? entry : max, ['', 0])[0];

        // Fetch the full details of the most selected category (color)
        let maxCategoryDetails = null;
        if (maxCategoryId) {
            maxCategoryDetails = await Color.findById(maxCategoryId);
        }

        res.json({
            status: 'success',
            body: {
                totalScore,
                correctAnswers,
                maxCategory: maxCategoryId,
                maxCategoryDetails // Return the full details of the most selected category (color)
            },
            message: 'Body Assessment taken successfully'
        });
    } catch (error) {
        console.error('Error taking body assessment:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'An error occurred while taking the body assessment'
        });
    }
};



module.exports = {
    createBodyAssessment,
    getAllBodyAssessments,
    getBodyAssessmentById,
    updateBodyAssessment,
    deleteBodyAssessment,
    getBodyAssessmentsByCategory,
    takeBodyAssessment,
    getQuestionsByPart,
    getQuestionsByParts
};
