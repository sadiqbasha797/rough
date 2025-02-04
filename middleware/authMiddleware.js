const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization').replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({
            status: 'error',
            body: null,
            message: 'No token provided, authorization denied'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.organization = decoded.organization;
        next();
    } catch (err) {
        res.status(401).json({
            status: 'error',
            body: null,
            message: 'Token is not valid'
        });
    }
};

module.exports = authMiddleware;
