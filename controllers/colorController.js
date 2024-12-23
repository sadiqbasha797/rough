const Color = require('../models/Color');

// Controller to create a new mood
const createMood = async (req, res) => {
    const { mood, hexColor, description } = req.body;

    // Validate input
    if (!mood || !hexColor || !description) {
        return res.status(400).json({
            status: 'error',
            body: null,
            message: 'Mood, color, and description are required'
        });
    }

    try {
        // Check if the mood already exists
        const existingMood = await Color.findOne({ mood });
        if (existingMood) {
            return res.status(400).json({
                status: 'error',
                body: null,
                message: 'Mood already exists'
            });
        }

        // Create and save the new mood
        const newMood = new Color({
            mood,
            hexColor,
            description
        });

        await newMood.save();

        res.status(201).json({
            status: 'success',
            body: newMood,
            message: 'Mood created successfully'
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: err.message
        });
    }
};

// Controller to get all moods
const getAllMoods = async (req, res) => {
    try {
        const moods = await Color.find({});
        res.status(200).json({
            status: 'success',
            body: moods,
            message: 'Moods retrieved successfully'
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: err.message
        });
    }
};

// Controller to get a specific mood by ID
const getMoodById = async (req, res) => {
    const { id } = req.params;

    try {
        const mood = await Color.findById(id);

        if (!mood) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'Mood not found'
            });
        }

        res.status(200).json({
            status: 'success',
            body: mood,
            message: 'Mood retrieved successfully'
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: err.message
        });
    }
};

// Controller to update a mood by ID
const updateMood = async (req, res) => {
    const { id } = req.params;
    const { mood, hexColor, description } = req.body;

    try {
        const updatedMood = await Color.findByIdAndUpdate(
            id,
            { mood, hexColor, description },
            { new: true, runValidators: true }
        );

        if (!updatedMood) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'Mood not found'
            });
        }

        res.status(200).json({
            status: 'success',
            body: updatedMood,
            message: 'Mood updated successfully'
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: err.message
        });
    }
};

// Controller to delete a mood by ID
const deleteMood = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedMood = await Color.findByIdAndDelete(id);

        if (!deletedMood) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'Mood not found'
            });
        }

        res.status(200).json({
            status: 'success',
            body: deletedMood,
            message: 'Mood deleted successfully'
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: err.message
        });
    }
};

module.exports = {
    createMood,
    getAllMoods,
    getMoodById,
    updateMood,
    deleteMood
};
