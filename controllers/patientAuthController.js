const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Patient = require('../models/patient');

// Patient signup
const signup = async (req, res) => {
  try {
    const { userName, email, password, dateOfBirth, mobile } = req.body;

    // Check if patient already exists
    let patient = await Patient.findOne({ email });
    if (patient) {
      return res.status(400).json({ message: 'Patient already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new patient
    patient = new Patient({
      userName,
      email,
      password: hashedPassword,
      dateOfBirth,
      mobile,
      verified: 'no', // Default to 'no' until email verification is implemented
    });

    await patient.save();

    res.status(201).json({ message: 'Patient registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Patient sign-in
const signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find patient by email
    const patient = await Patient.findOne({ email });
    if (!patient) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, patient.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: patient._id, email: patient.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({ token, message: 'Sign-in successful' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

module.exports = { signup, signin }; 