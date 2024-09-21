const OrgAdmin = require('../models/orgAdmin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const createNotification = require('../utils/createNotification'); 
const sendEmail = require('../utils/mailUtil'); 

const registerOrgAdmin = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const organizationId = req.organization._id;
        const hashedPassword = await bcrypt.hash(password, 10);

        const orgAdmin = new OrgAdmin({
            name,
            email,
            password: hashedPassword,
            organization: organizationId, 
        });

        await orgAdmin.save();
        const token = jwt.sign({ id: orgAdmin._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        await createNotification(
            organizationId,               
            'Organization',               
            `A new admin, ${name}, has been registered.`, 
            orgAdmin._id,                 
            'OrgAdmin',                
            'message'                   
        );

        await createNotification(
            orgAdmin._id,               
            'OrgAdmin',                   
            'Your admin account has been successfully created.', 
            null,                        
            null,                          
            'message'                    
        );

        await sendEmail(
            email,
            'Welcome to the Organization',
            `Hello ${name},\n\nYour admin account has been successfully created.\n\nBest Regards,\nYour Company Name`
        );

        res.status(201).json({
            status: 'success',
            body: { token, orgAdmin },
            message: 'OrgAdmin registered successfully'
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: err.message
        });
    }
};

// Login an existing OrgAdmin
const loginOrgAdmin = async (req, res) => {
    const { email, password } = req.body;

    try {
        const orgAdmin = await OrgAdmin.findOne({ email });

        if (!orgAdmin || !(await bcrypt.compare(password, orgAdmin.password))) {
            return res.status(401).json({
                status: 'error',
                body: null,
                message: 'Invalid credentials'
            });
        }

        const token = jwt.sign({ id: orgAdmin._id, role: 'orgAdmin', organization: orgAdmin.organization }, process.env.JWT_SECRET);
        const role = "orgAdmin";
        res.json({
            status: 'success',
            body: { token, orgAdmin, role },
            message: 'OrgAdmin logged in successfully'
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: err.message
        });
    }
};

// Get OrgAdmin details
const getOrgAdminDetails = (req, res) => {
    res.json({
        status: 'success',
        body: req.orgAdmin,
        message: 'OrgAdmin details retrieved successfully'
    });
};

// Update OrgAdmin details
const updateOrgAdmin = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        if (password) {
            req.orgAdmin.password = await bcrypt.hash(password, 10);
        }

        req.orgAdmin.name = name || req.orgAdmin.name;
        req.orgAdmin.email = email || req.orgAdmin.email;

        await req.orgAdmin.save();

        res.json({
            status: 'success',
            body: req.orgAdmin,
            message: 'OrgAdmin details updated successfully'
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: err.message
        });
    }
};

// Delete OrgAdmin
const deleteOrgAdmin = async (req, res) => {
    try {
        await OrgAdmin.findByIdAndDelete(req.orgAdmin._id);

        res.json({
            status: 'success',
            body: null,
            message: 'OrgAdmin deleted successfully'
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: err.message
        });
    }
};


const getOrgAdminsByOrganization = async (req, res) => {
    try {
        const organizationId  = req.organization._id;  // Get organizationId from request params

        const orgAdmins = await OrgAdmin.find({ organization: organizationId });

        if (!orgAdmins || orgAdmins.length === 0) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'No org admins found for this organization'
            });
        }

        res.status(200).json({
            status: 'success',
            body: orgAdmins,
            message: 'Org admins retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error fetching org admins: ' + error.message
        });
    }
};

const getOrgAdminCounts = async (req, res) => {
    try {
        const organizationId = req.organization._id;  // Get organizationId from request params

        const totalAdmins = await OrgAdmin.countDocuments({ organization: organizationId });
        const activeAdmins = await OrgAdmin.countDocuments({ organization: organizationId, Active: 'yes' });
        const inactiveAdmins = await OrgAdmin.countDocuments({ organization: organizationId, Active: 'no' });

        res.status(200).json({
            status: 'success',
            body: {
                totalAdmins,
                activeAdmins,
                inactiveAdmins
            },
            message: 'Org admin counts retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error fetching org admin counts: ' + error.message
        });
    }
};

// Fetch All OrgAdmins of a Particular Organization
const getAllOrgAdminsByOrganization = async (req, res) => {
    try {
        const organizationId = req.organization._id;  // Get organizationId from request params

        const orgAdmins = await OrgAdmin.find({ organization: organizationId });

        if (!orgAdmins || orgAdmins.length === 0) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'No org admins found for this organization'
            });
        }

        res.status(200).json({
            status: 'success',
            body: orgAdmins,
            message: 'Org admins retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error fetching org admins: ' + error.message
        });
    }
};

// Fetch Active OrgAdmins of a Particular Organization
const getActiveOrgAdminsByOrganization = async (req, res) => {
    try {
        const organizationId = req.organization._id;  // Get organizationId from request params

        const activeOrgAdmins = await OrgAdmin.find({ organization: organizationId, Active: 'yes' });

        if (!activeOrgAdmins || activeOrgAdmins.length === 0) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'No active org admins found for this organization'
            });
        }

        res.status(200).json({
            status: 'success',
            body: activeOrgAdmins,
            message: 'Active org admins retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error fetching active org admins: ' + error.message
        });
    }
};

// Fetch Inactive OrgAdmins of a Particular Organization
const getInactiveOrgAdminsByOrganization = async (req, res) => {
    try {
        const organizationId = req.organization._id;  // Get organizationId from request params

        const inactiveOrgAdmins = await OrgAdmin.find({ organization: organizationId, Active: 'no' });

        if (!inactiveOrgAdmins || inactiveOrgAdmins.length === 0) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'No inactive org admins found for this organization'
            });
        }

        res.status(200).json({
            status: 'success',
            body: inactiveOrgAdmins,
            message: 'Inactive org admins retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error fetching inactive org admins: ' + error.message
        });
    }
};

module.exports = {
    registerOrgAdmin,
    loginOrgAdmin,
    getOrgAdminDetails,
    updateOrgAdmin,
    deleteOrgAdmin,
    getAllOrgAdminsByOrganization, 
    getActiveOrgAdminsByOrganization, 
    getInactiveOrgAdminsByOrganization ,
    getOrgAdminCounts,
    getOrgAdminsByOrganization
};
