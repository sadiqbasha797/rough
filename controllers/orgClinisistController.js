const bcrypt = require('bcrypt');
const Clinisist = require('../models/Clinisist');
const createNotification = require('../utils/createNotification');
const sendEmail = require('../utils/mailUtil');

// Handler for registering a Clinisist by an Organization
const registerClinisistOrganization = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const organizationId = req.organization._id;

        // Check if the Clinisist already exists
        const existingClinisist = await Clinisist.findOne({ email });
        if (existingClinisist) {
            return res.status(400).json({
                status: 'error',
                body: null,
                message: 'Clinisist already exists'
            });
        }

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new Clinisist instance
        const clinisist = new Clinisist({
            name,
            email,
            password: hashedPassword,
            organization: organizationId,
        });

        await clinisist.save();

        // Send email to the registered Clinisist
        const subject = 'Welcome to Our Platform';
        const message = `Dear ${name},\n\nWelcome to our platform. Your account has been created successfully.\n\nBest Regards,\nTeam`;
        await sendEmail(email, subject, message);

        // Send notifications to both Clinisist and organization
        await createNotification(clinisist._id, 'Clinisist', 'You have been registered as a Clinisist', organizationId, 'Organization', 'general');
        await createNotification(organizationId, 'Organization', `A new Clinisist, ${name}, has been registered.`, organizationId, 'Organization', 'general');

        res.status(201).json({
            status: 'success',
            body: clinisist,
            message: 'Clinisist registered successfully'
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: err.message
        });
    }
};

// Handler for registering a Clinisist by an OrgAdmin
const registerClinisistOrgAdmin = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const organizationId = req.orgAdmin.organization;
        console.log("org_id",organizationId);
        const orgadminId = req.orgAdmin._id;

        const existingClinisist = await Clinisist.findOne({ email });
        if (existingClinisist) {
            return res.status(400).json({
                status: 'error',
                body: null,
                message: 'Clinisist already exists'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const clinisist = new Clinisist({
            name,
            email,
            password: hashedPassword,
            organization: organizationId,
        });

        await clinisist.save();

        const subject = 'Welcome to Our Platform';
        const message = `Dear ${name},\n\nWelcome to our platform. Your account has been created successfully.\n\nBest Regards,\nTeam`;
        await sendEmail(email, subject, message);

        await createNotification(clinisist._id, 'Clinisist', 'You have been registered as a Clinisist', orgadminId, 'OrgAdmin', 'general');
        await createNotification(organizationId, 'Organization', `A new Clinisist, ${name}, has been registered by an OrgAdmin.`, orgadminId, 'OrgAdmin', 'general');

        res.status(201).json({
            status: 'success',
            body: clinisist,
            message: 'Clinisist registered successfully'
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: err.message
        });
    }
};

// Handler for registering a Clinisist by a Manager
const registerClinisistManager = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const organizationId = req.manager.organization;
        const managerId = req.manager._id;

        const existingClinisist = await Clinisist.findOne({ email });
        if (existingClinisist) {
            return res.status(400).json({
                status: 'error',
                body: null,
                message: 'Clinisist already exists'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const clinisist = new Clinisist({
            name,
            email,
            password: hashedPassword,
            organization: organizationId,
        });

        await clinisist.save();

        const subject = 'Welcome to Our Platform';
        const message = `Dear ${name},\n\nWelcome to our platform. Your account has been created successfully.\n\nBest Regards,\nTeam`;
        await sendEmail(email, subject, message);

        await createNotification(clinisist._id, 'Clinisist', 'You have been registered as a Clinisist', managerId, 'Manager', 'general');
        await createNotification(organizationId, 'Organization', `A new Clinisist, ${name}, has been registered by a Manager.`, managerId, 'Manager', 'general');

        res.status(201).json({
            status: 'success',
            body: clinisist,
            message: 'Clinisist registered successfully'
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: err.message
        });
    }
};

module.exports = { registerClinisistOrganization, registerClinisistOrgAdmin, registerClinisistManager };
