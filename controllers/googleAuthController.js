const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const Patient = require('../models/patient');
const jwt = require('jsonwebtoken');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback',
      scope: ['profile', 'email']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if patient already exists
        let patient = await Patient.findOne({ email: profile.emails[0].value });

        if (patient) {
          return done(null, patient);
        }

        // If patient doesn't exist, create new patient
        patient = await Patient.create({
          userName: `${profile.name.givenName} ${profile.name.familyName}`,
          email: profile.emails[0].value,
          password: 'google-oauth-' + Math.random().toString(36).slice(-8), // Random password for OAuth users
          dateOfBirth: new Date(), // You might want to collect this separately
          mobile: '', // You might want to collect this separately
          image: profile.photos[0].value,
          verified: 'yes', // Since it's Google OAuth
          privacy: "Agreed", // Since they're using Google OAuth
          googleId: profile.id // Add this field to your schema
        });

        return done(null, patient);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Serialize patient for the session
passport.serializeUser((patient, done) => {
  done(null, patient.id);
});

// Deserialize patient from the session
passport.deserializeUser(async (id, done) => {
  try {
    const patient = await Patient.findById(id);
    done(null, patient);
  } catch (error) {
    done(error, null);
  }
});

// Generate JWT token
const generateToken = (patient) => {
  return jwt.sign(
    { 
      userId: patient._id, 
      email: patient.email,
      role: 'patient'
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

module.exports = { passport, generateToken }; 