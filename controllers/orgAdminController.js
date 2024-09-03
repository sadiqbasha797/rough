const OrgAdmin = require('../models/orgAdmin');
const bcrypt = require('bcrypt');
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

        res.json({
            status: 'success',
            body: { token, orgAdmin },
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

module.exports = {
    registerOrgAdmin,
    loginOrgAdmin,
    getOrgAdminDetails,
    updateOrgAdmin,
    deleteOrgAdmin,
};
