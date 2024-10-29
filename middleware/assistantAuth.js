const jwt = require('jsonwebtoken');
const Assistant = require('../models/assistant');
const dotenv = require('dotenv');

dotenv.config();

const assistantAuth = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Assistant Token Decoded:', decoded);

            // Get assistant from the token
            req.assistant = await Assistant.findById(decoded.id).select('-password');
            console.log('Assistant Found:', req.assistant);

            if (!req.assistant) {
                return res.status(401).json({
                    status: 'error',
                    body: null,
                    message: 'Authentication failed'
                });
            }

            next();
        } catch (error) {
            console.error('Assistant Authentication Error:', error.message);
            res.status(401).json({
                status: 'error',
                body: null,
                message: 'Not authorized, token failed'
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

module.exports = { assistantAuth }; 