const PatientInfo = require('../models/patientInfo');
const Patient = require('../models/patient');
const bcrypt = require('bcryptjs');

const getFixedQuestions = (req, res) => {
    try {
        const questions = {
            treatmentHistory: [
                'What treatments have you undergone in the past?',
                'Are you currently on any medication?',
                'Do you have any allergies to medications?'
            ],
            socialInformation: [
                'Do you smoke?',
                'How often do you consume alcohol?',
                'What is your exercise routine?'
            ],
            medicalHistory: [
                'Do you have any chronic conditions?',
                'Have you had any major surgeries?',
                'Is there a family history of any diseases?'
            ]
        };

        res.json({
            status: 'success',
            body: questions,
            message: 'Fixed questions retrieved successfully'
        });
    } catch (error) {
        console.error('Error retrieving fixed questions:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'An error occurred while retrieving fixed questions',
            error: error.message
        });
    }
};

module.exports = { getFixedQuestions };


// Controller function to create or update patient answers
const createOrUpdatePatientAnswers = async (req, res) => {
    try {
        const patientId = req.patient._id; // Assuming patientId is set by middleware
        const { treatmentHistory, socialInformation, medicalHistory } = req.body;

        // Find or create patient info record
        let patientInfo = await PatientInfo.findOne({ patientId });

        if (!patientInfo) {
            patientInfo = new PatientInfo({ patientId });
        }

        // Update or add answers for treatment history if present
        if (Array.isArray(treatmentHistory)) {
            patientInfo.treatmentHistory = patientInfo.treatmentHistory.map(history => {
                const update = treatmentHistory.find(item => item.question === history.question);
                return update ? { ...history, answer: update.answer, description: update.description } : history;
            }).concat(treatmentHistory.filter(item => !patientInfo.treatmentHistory.some(history => history.question === item.question)));
        }

        // Update or add answers for social information if present
        if (Array.isArray(socialInformation)) {
            patientInfo.socialInformation = patientInfo.socialInformation.map(info => {
                const update = socialInformation.find(item => item.question === info.question);
                return update ? { ...info, answer: update.answer, description: update.description } : info;
            }).concat(socialInformation.filter(item => !patientInfo.socialInformation.some(info => info.question === item.question)));
        }

        // Update or add answers for medical history if present
        if (Array.isArray(medicalHistory)) {
            patientInfo.medicalHistory = patientInfo.medicalHistory.map(history => {
                const update = medicalHistory.find(item => item.question === history.question);
                return update ? { ...history, answer: update.answer, description: update.description } : history;
            }).concat(medicalHistory.filter(item => !patientInfo.medicalHistory.some(history => history.question === item.question)));
        }

        // Save the patient info record
        await patientInfo.save();

        res.json({
            status: 'success',
            body: patientInfo,
            message: 'Patient answers created/updated successfully'
        });
    } catch (error) {
        console.error('Error creating or updating patient answers:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'An error occurred while creating or updating patient answers',
            error: error.message
        });
    }
};

// Controller function to get patient information by patient ID
const getPatientInfo = async (req, res) => {
    try {
        const patientId = req.patient._id; // Patient ID from middleware

        // Find patient information by ID
        const patientInfo = await PatientInfo.findOne({ patientId }).exec();

        if (!patientInfo) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'Patient information not found'
            });
        }

        res.json({
            status: 'success',
            body: patientInfo,
            message: 'Patient information retrieved successfully'
        });
    } catch (error) {
        console.error('Error retrieving patient information:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'An error occurred while retrieving patient information',
            error: error.message
        });
    }
};

const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    // Check if both currentPassword and newPassword are provided
    if (!currentPassword || !newPassword) {
        return res.status(400).json({
            status: 'error',
            body: null,
            message: 'Current password and new password are required'
        });
    }

    try {
        // Fetch the patient from the database
        const patient = await Patient.findById(req.patient._id);

        if (!patient) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'Patient not found'
            });
        }

        // Compare the provided current password with the stored hashed password
        const isMatch = await bcrypt.compare(currentPassword, patient.password);

        if (!isMatch) {
            return res.status(400).json({
                status: 'error',
                body: null,
                message: 'Current password is incorrect'
            });
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update the patient’s password
        patient.password = hashedPassword;
        await patient.save();

        res.status(200).json({
            status: 'success',
            body: null,
            message: 'Password changed successfully'
        });

    } catch (err) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: err.message
        });
    }
};


module.exports = {changePassword, createOrUpdatePatientAnswers, getFixedQuestions, getPatientInfo };
