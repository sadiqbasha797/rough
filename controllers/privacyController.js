const PrivacyPolicy = require('../models/privacy');
const Patient = require('../models/patient');
const moment = require('moment');

const updatePrivacy = async (req, res) => {
    try {
        const patientId = req.patient._id; // Assuming patientId is set by middleware
        const { privacy } = req.body;

        if (!privacy) {
            return res.status(400).json({
                status: 'error',
                body: null,
                message: 'Privacy field is required'
            });
        }

        // Find the patient and update their privacy field
        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'Patient not found'
            });
        }

        patient.privacy = privacy;

        // Save the updated patient record
        await patient.save();

        res.json({
            status: 'success',
            body: patient,
            message: 'Privacy field updated successfully'
        });
    } catch (error) {
        console.error('Error updating privacy field:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'An error occurred while updating the privacy field',
            error: error.message
        });
    }
};


const createPrivacyPolicy = async (req, res) => {
    try {
        const { title, content } = req.body;

        if (!title || !content) {
            return res.status(400).json({
                status: 'error',
                body: null,
                message: 'Title and content are required'
            });
        }

        const privacyPolicy = new PrivacyPolicy({ title, content });
        const createdPolicy = await privacyPolicy.save();

        res.status(201).json({
            status: 'success',
            body: createdPolicy,
            message: 'Privacy policy created successfully'
        });
    } catch (error) {
        console.error('Error creating privacy policy:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'An error occurred while creating the privacy policy',
            error: error.message
        });
    }
};

const updatePrivacyPolicy = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content } = req.body;

        if (!title || !content) {
            return res.status(400).json({
                status: 'error',
                body: null,
                message: 'Title and content are required'
            });
        }

        const privacyPolicy = await PrivacyPolicy.findByIdAndUpdate(id, { title, content, updatedAt: Date.now() }, { new: true });
        if (!privacyPolicy) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'Privacy policy not found'
            });
        }

        res.json({
            status: 'success',
            body: privacyPolicy,
            message: 'Privacy policy updated successfully'
        });
    } catch (error) {
        console.error('Error updating privacy policy:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'An error occurred while updating the privacy policy',
            error: error.message
        });
    }
};

const getPrivacyPolicy = async (req, res) => {
    try {
        // Retrieve the latest privacy policy
        const privacyPolicy = await PrivacyPolicy.findOne().sort({ updatedAt: -1 });

        if (!privacyPolicy) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'No privacy policy found'
            });
        }

        // Format the updatedAt field
        const formattedDate = moment(privacyPolicy.updatedAt).format('Do MMMM YYYY');

        res.json({
            status: 'success',
            body: {
                ...privacyPolicy.toObject(),
                updatedAt: formattedDate
            },
            message: 'Privacy policy retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'An error occurred while retrieving the privacy policy',
            error: error.message
        });
    }
};

module.exports = { createPrivacyPolicy, updatePrivacyPolicy, getPrivacyPolicy, updatePrivacy };
