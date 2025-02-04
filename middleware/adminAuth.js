const passport = require('passport');

const adminAuth = (req, res, next) => {
    passport.authenticate('jwt', {session: false}, (err, admin, info)=> {
        if (err) {
            return next(err);
        }
        if (!admin) {
            return res.status(401).json({
                message: 'Unauthorized',
            });
        }

        req.admin = admin;
        next();
    })(req, res, next);
};

module.exports = {adminAuth};