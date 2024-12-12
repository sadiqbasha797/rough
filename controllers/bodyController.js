const Body = require('../models/body');  // Import the Body model

// Create a new body part
const createBodyPart = async (req, res) => {
    try {
        const { partName, description } = req.body;

        // Ensure partName and description are provided
        if (!partName || !description) {
            return res.status(400).json({
                status: 'error',
                message: 'partName and description are required'
            });
        }

        // Create a new body part
        const newBodyPart = new Body({ partName, description });
        await newBodyPart.save();

        res.status(201).json({
            status: 'success',
            body: newBodyPart,
            message: 'Body part created successfully'
        });
    } catch (error) {
        console.error('Error creating body part:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while creating the body part'
        });
    }
};

// Get all body parts
const getAllBodyParts = async (req, res) => {
    try {
        const bodyParts = await Body.find({});
        res.status(200).json({
            status: 'success',
            body: bodyParts,
            message: 'Body parts retrieved successfully'
        });
    } catch (error) {
        console.error('Error fetching body parts:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while retrieving body parts'
        });
    }
};

// Get a body part by ID
const getBodyPartById = async (req, res) => {
    try {
        const bodyPart = await Body.findById(req.params.id);
        if (!bodyPart) {
            return res.status(404).json({
                status: 'error',
                message: 'Body part not found'
            });
        }
        res.status(200).json({
            status: 'success',
            body: bodyPart,
            message: 'Body part retrieved successfully'
        });
    } catch (error) {
        console.error('Error fetching body part:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while retrieving the body part'
        });
    }
};

// Update a body part
const updateBodyPart = async (req, res) => {
    try {
        const { partName, description } = req.body;

        // Update the body part by ID
        const updatedBodyPart = await Body.findByIdAndUpdate(req.params.id, {
            partName,
            description
        }, { new: true });  // Return the updated document

        if (!updatedBodyPart) {
            return res.status(404).json({
                status: 'error',
                message: 'Body part not found'
            });
        }

        res.status(200).json({
            status: 'success',
            body: updatedBodyPart,
            message: 'Body part updated successfully'
        });
    } catch (error) {
        console.error('Error updating body part:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while updating the body part'
        });
    }
};

// Delete a body part
const deleteBodyPart = async (req, res) => {
    try {
        const bodyPart = await Body.findByIdAndDelete(req.params.id);

        if (!bodyPart) {
            return res.status(404).json({
                status: 'error',
                message: 'Body part not found'
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Body part deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting body part:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while deleting the body part'
        });
    }
};

module.exports = {
    createBodyPart,
    getAllBodyParts,
    getBodyPartById,
    updateBodyPart,
    deleteBodyPart
};
