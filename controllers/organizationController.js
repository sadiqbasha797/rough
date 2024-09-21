const Organization = require('../models/organization');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const createNotification = require('../utils/createNotification'); // Import the notification helper
const sendEmail = require('../utils/mailUtil'); // Import the mail utility
const Clinisist = require('../models/Clinisist');

const registerOrganization = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // Check if the organization already exists
        const existingOrg = await Organization.findOne({ email });
        if (existingOrg) {
            return res.status(400).json({
                status: 'error',
                body: null,
                message: 'Organization already exists'
            });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new organization
        const newOrg = new Organization({
            name,
            email,
            password: hashedPassword,
        });

        await newOrg.save();

        // Create a notification for the newly registered organization
        await createNotification(
            newOrg._id,               
            'Organization',           
            'Your organization has been successfully registered.', 
            null,                     
            null,                     
            'message'                 
        );

        // Send a welcome email to the newly registered organization
        await sendEmail(
            email,
            'Welcome to Our Platform',
            `Hello ${name},\n\nYour organization has been successfully registered.\n\nThank you for joining us!\n\nBest Regards,\nYour Company Name`
        );

        // Respond with the new organization data
        res.status(201).json({
            status: 'success',
            body: newOrg,
            message: 'Organization registered successfully'
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: err.message
        });
    }
};



// Authenticate an Organization
const loginOrganization = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if the organization exists
        const organization = await Organization.findOne({ email });
        if (!organization) {
            return res.status(400).json({
                status: 'error',
                body: null,
                message: 'Invalid email or password'
            });
        }

        // Compare the password
        const isMatch = await bcrypt.compare(password, organization.password);
        if (!isMatch) {
            return res.status(400).json({
                status: 'error',
                body: null,
                message: 'Invalid email or password'
            });
        }

        // Create and return a JWT token
        const token = jwt.sign(
            { organization: { id: organization._id, name: organization.name } },
            process.env.JWT_SECRET,
        );
        const role = "Organization"

        res.json({
            status: 'success',
            body: { 
                organization : {
                    id : organization._id,
                    name : organization.name,
                    email : organization.email,
                    token,
                    role
                }
             },
            message: 'Organization authenticated successfully'
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: err.message
        });
    }
};

// Get Organization details
const getOrganization = async (req, res) => {
    try {
        const organization = await Organization.findById(req.organization.id).select('-password');
        res.json({
            status: 'success',
            body: organization,
            message: 'Organization details retrieved successfully'
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: err.message
        });
    }
};

// Fetch all Clinisists for a particular organization
const getClinisistsByOrganization = async (req, res) => {
    try {
        const  organizationId  = req.organization._id;
        console.log(organizationId);
        const clinisists = await Clinisist.find({ organization: organizationId });
        if (!clinisists.length) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'No Clinisists found for the specified organization'
            });
        }

        res.json({
            status: 'success',
            body: clinisists,
            message: 'Clinisists retrieved successfully'
        });
    } catch (error) {
        console.error('Error fetching Clinisists:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error fetching Clinisists'
        });
    }
};

const getActiveClinisistsByOrganization = async (req, res) => {
    try {
        const  organizationId  = req.organization._id;
        const activeClinisists = await Clinisist.find({ organization: organizationId, Active: 'yes' });

        if (!activeClinisists.length) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'No active Clinisists found for the specified organization'
            });
        }

        res.json({
            status: 'success',
            body: activeClinisists,
            message: 'Active Clinisists retrieved successfully'
        });
    } catch (error) {
        console.error('Error fetching active Clinisists:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error fetching active Clinisists'
        });
    }
};

const getInactiveClinisistsByOrganization = async (req, res) => {
    try {
        const  organizationId  = req.organization._id;
        const inactiveClinisists = await Clinisist.find({ organization: organizationId, Active: 'no' });

        if (!inactiveClinisists.length) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'No inactive Clinisists found for the specified organization'
            });
        }

        res.json({
            status: 'success',
            body: inactiveClinisists,
            message: 'Inactive Clinisists retrieved successfully'
        });
    } catch (error) {
        console.error('Error fetching inactive Clinisists:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error fetching inactive Clinisists'
        });
    }
};

const getClinisistCountByOrganization = async (req, res) => {
    try {
        const  organizationId  = req.organization._id;
        const activeCount = await Clinisist.countDocuments({ organization: organizationId, Active: 'yes' });
        const inactiveCount = await Clinisist.countDocuments({ organization: organizationId, Active: 'no' });
        const total = activeCount + inactiveCount;
        res.json({
            status: 'success',
            body: { activeCount, inactiveCount, total },
            message: 'Clinisist counts retrieved successfully'
        });
    } catch (error) {
        console.error('Error fetching Clinisist counts:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error fetching Clinisist counts'
        });
    }
};

const getCreatedByClinisist = async (req, res) => {
    try {
        const organizationId = req.organization._id;
        const clinisists = await Clinisist.find({ createdBy: organizationId });

        if (!clinisists || clinisists.length === 0) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'No clinisists found for this organization'
            });
        }

        res.status(200).json({
            status: 'success',
            body: clinisists,
            message: 'Clinisists retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error fetching clinisists: ' + error.message
        });
    }
};

// ... existing code ...

const Subscription = require('../models/subscription');
const Patient = require('../models/patient');

// Add this new function to the organizationController
const getSubscribedPatients = async (req, res) => {
    try {
        const organizationId = req.organization._id;

        // Find all clinicians belonging to this organization
        const clinicians = await Clinisist.find({ organization: organizationId });
        const clinicianIds = clinicians.map(clinician => clinician._id);

        // Find all subscriptions for these clinicians
        const subscriptions = await Subscription.find({
            clinisist: { $in: clinicianIds }
        }).populate('patient').populate('clinisist');

        // Group patients by clinician
        const patientsByClinician = {};

        subscriptions.forEach(subscription => {
            const clinicianId = subscription.clinisist._id.toString();
            const patientData = subscription.patient;

            if (!patientsByClinician[clinicianId]) {
                patientsByClinician[clinicianId] = {
                    clinician: {
                        id: subscription.clinisist._id,
                        name: subscription.clinisist.name
                    },
                    patients: []
                };
            }

            patientsByClinician[clinicianId].patients.push({
                id: patientData._id,
                name: patientData.userName,
                email: patientData.email
            });
        });

        const result = Object.values(patientsByClinician);

        res.status(200).json({
            status: 'success',
            body: result,
            message: 'Subscribed patients retrieved successfully'
        });
    } catch (error) {
        console.error('Error fetching subscribed patients:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error fetching subscribed patients'
        });
    }
};

// ... existing code ...


module.exports = {
    getClinisistsByOrganization,
    registerOrganization,
    loginOrganization,
    getOrganization,
    getActiveClinisistsByOrganization,
    getInactiveClinisistsByOrganization, 
    getClinisistCountByOrganization,
    getCreatedByClinisist,
    getSubscribedPatients
};
