const Organization = require('../models/organization');
const jwt = require('jsonwebtoken');

// Middleware to authenticate the organization
const authOrganization = async (req, res, next) => {
    const token = req.header('Authorization').replace('Bearer ', '');
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const organization = await Organization.findOne({ _id: decoded._id });

        if (!organization) {
            throw new Error();
        }

        req.organization = organization;
        next();
    } catch (error) {
        res.status(401).json({
            status: 'error',
            body: null,
            message: 'Please authenticate as an organization'
        });
    }
};

module.exports = authOrganization;
