const jwt = require('jsonwebtoken');
const Patient = require('../models/patient');
const Clinisist = require('../models/Clinisist');
const OrgAdmin = require('../models/orgAdmin');
const Manager = require('../models/manager');
const Organization = require('../models/organization');
const dotenv = require('dotenv');

dotenv.config(); 

const verifyToken = async (req, res, next, userModel, userType) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(" ")[1];
            console.log('Token:', token);
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log(`${userType} Token Decoded:`, decoded);

            // Extract the ID based on the structure of the decoded token
            const userId = decoded.id;
            console.log(`${userType} ID:`, userId);

            req[userType] = await userModel.findById(userId).select('-password');
            console.log(`${userType} Found:`, req[userType]);

            if (!req[userType]) {
                console.log(`${userType} not found in database`);
                return res.status(401).json({
                    status: 'error',
                    body: null,
                    message: 'Authentication failed'
                });
            }

            // Add role to the request object
            req.role = decoded.role;

            next();
        } catch (error) {
            console.error(`${userType} Authentication Error:`, error);
            res.status(401).json({
                status: 'error',
                body: null,
                message: "Not Authorized, token failed"
            });
        }
    } else {
        res.status(401).json({
            status: 'error',
            body: null,
            message: 'Not authorized, no token'
        });
    }
};

// Dedicated function to verify Manager
const verifyManagerToken = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Extract the token from the authorization header
            token = req.headers.authorization.split(" ")[1];
            console.log('Manager Token:', token);

            // Verify the token using JWT_SECRET
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Decoded Manager Token:', decoded);

            // Extract manager ID from the token's manager object
            const managerId = decoded.manager?.id;
            console.log('Manager ID:', managerId);

            // Find the manager by ID, excluding the password field
            req.manager = await Manager.findById(managerId).select('-password');
            console.log('Manager Found:', req.manager);

            if (!req.manager) {
                return res.status(401).json({
                    status: 'error',
                    body: null,
                    message: 'Manager not found in database'
                });
            }

            // Add manager role to the request object
            req.role = 'manager';

            next();
        } catch (error) {
            console.error('Manager Authentication Error:', error);
            res.status(401).json({
                status: 'error',
                body: null,
                message: "Not Authorized, token failed"
            });
        }
    } else {
        res.status(401).json({
            status: 'error',
            body: null,
            message: 'Not authorized, no token'
        });
    }
};

// Middleware functions
const patientProtect = (req, res, next) => verifyToken(req, res, next, Patient, 'patient');
const clincistProtect = (req, res, next) => verifyToken(req, res, next, Clinisist, 'clinisist');
const authenticateOrgAdmin = (req, res, next) => verifyToken(req, res, next, OrgAdmin, 'orgAdmin');
const authenticateManager = (req, res, next) => verifyToken(req, res, next, Manager, 'manager');
const authOrganization = (req, res, next) => verifyToken(req, res, next, Organization, 'organization');

module.exports = {verifyManagerToken, patientProtect, clincistProtect, authenticateOrgAdmin, authenticateManager, authOrganization };
