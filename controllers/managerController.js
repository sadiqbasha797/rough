const Manager = require('../models/manager');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/mailUtil'); 

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

        res.json({
            status: 'success',
            body: { token, manager },
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

module.exports = {
    registerManager,
    loginManager,
    getManagerDetails,
    updateManager,
    deleteManager,
};
