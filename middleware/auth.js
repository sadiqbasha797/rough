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
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log(`${userType} Token Decoded:`, decoded);

            // Extract the ID based on the structure of the decoded token
            const userId = decoded[userType]?.id || decoded.id;

            req[userType] = await userModel.findById(userId).select('-password');
            console.log(`${userType} Found:`, req[userType]);

            if (!req[userType]) {
                return res.status(401).json({
                    status: 'error',
                    body: null,
                    message: 'Authentication failed'
                });
            }

            next();
        } catch (error) {
            console.error(`${userType} Authentication Error:`, error.message);
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

module.exports = { patientProtect, clincistProtect, authenticateOrgAdmin, authenticateManager, authOrganization };
