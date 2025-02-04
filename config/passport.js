const mongoose = require('mongoose');
const LocalStrategy = require('passport-local').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const bcrypt = require('bcryptjs');
const Admin = require('../models/admin');
const passport = require('passport');

const localOptions = {usernameField: 'email'};
const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET,
};

passport.use(new LocalStrategy(localOptions, async (email, password, done) => {
    try {
        const admin = await Admin.findOne({ email });
        
        if (!admin) {
            return done(null, false, {message: 'Invalid credentials'});
        }

        const isMatch = await bcrypt.compare(password, admin.password);

        if (!isMatch) {
            return done(null, false, {message: 'Invalid credentials'});
        }

        return done(null, admin);
    } catch(err) {
        return done(err, false);
    }
}));

passport.use(new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
        const admin = await Admin.findById(payload.id);

        if (admin) {
            return done(null, admin);
        }
        return done(null, false);
    } catch(err) {
        return done(err, false);
    }
}));

passport.serializeUser((admin, done) => {
    done(null, admin._id);
});

passport.deserializeUser( async (id, done) => {
    try {
        const admin = await Admin.findById(id);
        done(null, admin);

    } catch(err) {
        done(err, false);
    }
});