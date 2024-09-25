const Manager = require('../models/manager');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/mailUtil'); 
const createNotification = require('../utils/createNotification'); 

const registerManager = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const organizationId = req.organization._id;
        const hashedPassword = await bcrypt.hash(password, 10);

        const manager = new Manager({
            name,
            email,
            password: hashedPassword,
            organization: organizationId, 
        });

        await manager.save();
        const token = jwt.sign({ id: manager._id, organization: manager.organization, role:"manager" }, process.env.JWT_SECRET, { expiresIn: '1h' });

        await createNotification(
            organizationId,               
            'Organization',               
            `A new manager, ${name}, has been registered.`, 
            manager._id,                 
            'Manager',               
            'message'                   
        );

        await createNotification(
            manager._id,                  
            'Manager',                   
            'Your manager account has been successfully created.',
            null,                        
            null,                      
            'message'                    
        );

        await sendEmail(
            email,
            'Welcome to the Organization',
            `Hello ${name},\n\nYour manager account has been successfully created.\n\nBest Regards,\nYour Company Name`
        );

        res.status(201).json({
            status: 'success',
            body: { token, manager },
            message: 'Manager registered successfully'
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: err.message
        });
    }
};

// Login an existing Manager
const loginManager = async (req, res) => {
    const { email, password } = req.body;

    try {
        const manager = await Manager.findOne({ email });

        if (!manager || !(await bcrypt.compare(password, manager.password))) {
            return res.status(401).json({
                status: 'error',
                body: null,
                message: 'Invalid credentials'
            });
        }

        const token = jwt.sign({ id: manager._id, organization: manager.organization, role:"manager" }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const role = "Manager";
        res.json({
            status: 'success',
            body: { token, manager, role },
            message: 'Manager logged in successfully'
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: err.message
        });
    }
};

// Get Manager details
const getManagerDetails = (req, res) => {
    res.json({
        status: 'success',
        body: req.manager,
        message: 'Manager details retrieved successfully'
    });
};

// Update Manager details
const updateManager = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        if (password) {
            req.manager.password = await bcrypt.hash(password, 10);
        }

        req.manager.name = name || req.manager.name;
        req.manager.email = email || req.manager.email;

        await req.manager.save();

        res.json({
            status: 'success',
            body: req.manager,
            message: 'Manager details updated successfully'
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: err.message
        });
    }
};

// Delete Manager
const deleteManager = async (req, res) => {
    try {
        await Manager.findByIdAndDelete(req.manager._id);

        res.json({
            status: 'success',
            body: null,
            message: 'Manager deleted successfully'
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: err.message
        });
    }
};

// Fetch All Managers of a Particular Organization
const getAllManagersByOrganization = async (req, res) => {
    try {
        const organizationId  = req.organization._id; 
        const managers = await Manager.find({ organization: organizationId });

        if (!managers || managers.length === 0) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'No managers found for this organization'
            });
        }

        res.status(200).json({
            status: 'success',
            body: managers,
            message: 'Managers retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error fetching managers: ' + error.message
        });
    }
};

// Fetch Active Managers of a Particular Organization
const getActiveManagersByOrganization = async (req, res) => {
    try {
        const organizationId  = req.organization._id; 
        const activeManagers = await Manager.find({ organization: organizationId, Active: 'yes' });

        if (!activeManagers || activeManagers.length === 0) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'No active managers found for this organization'
            });
        }

        res.status(200).json({
            status: 'success',
            body: activeManagers,
            message: 'Active managers retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error fetching active managers: ' + error.message
        });
    }
};

// Fetch Inactive Managers of a Particular Organization
const getInactiveManagersByOrganization = async (req, res) => {
    try {
        const organizationId  = req.organization._id; 
        const inactiveManagers = await Manager.find({ organization: organizationId, Active: 'no' });

        if (!inactiveManagers || inactiveManagers.length === 0) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'No inactive managers found for this organization'
            });
        }

        res.status(200).json({
            status: 'success',
            body: inactiveManagers,
            message: 'Inactive managers retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error fetching inactive managers: ' + error.message
        });
    }
};

// Fetch Counts of Active, Inactive, and Total Managers of a Particular Organization
const getManagersCountByOrganization = async (req, res) => {
    try {
        const organizationId  = req.organization._id; 
        const totalManagers = await Manager.countDocuments({ organization: organizationId });
        const activeManagersCount = await Manager.countDocuments({ organization: organizationId, Active: 'yes' });
        const inactiveManagersCount = await Manager.countDocuments({ organization: organizationId, Active: 'no' });

        res.status(200).json({
            status: 'success',
            body: {
                total: totalManagers,
                active: activeManagersCount,
                inactive: inactiveManagersCount
            },
            message: 'Manager counts retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error fetching manager counts: ' + error.message
        });
    }
};

module.exports = {
    registerManager,
    loginManager,
    getManagerDetails,
    updateManager,
    deleteManager,
    getAllManagersByOrganization, 
    getActiveManagersByOrganization, 
    getInactiveManagersByOrganization, 
    getManagersCountByOrganization 
};
