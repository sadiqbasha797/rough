const Patient = require('../models/patient');
const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken');
const Clinisist = require('../models/Clinisist');
const nodemailer = require('nodemailer');
const crypto = require('crypto'); // To generate a token
const createNotification = require('../utils/createNotification');



const registerPatient = async (req, res) => {
    const { userName, email, password, dateOfBirth, address, mobile, guardian,location } = req.body;
    const dob = new Date(dateOfBirth);

    try {
        const patientExists = await Patient.findOne({ email });
        if (patientExists) {
            return res.status(400).json({
                status: 'error',
                body: null,
                message: 'User already exists'
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate a verification token
        const verificationToken = crypto.randomBytes(20).toString('hex');
        const tokenExpiration = Date.now() + 3600000; // 1 hour before the token expires

        const patient = await Patient.create({
            userName,
            email,
            password: hashedPassword,
            dateOfBirth: dob,
            address,
            verificationToken,
            mobile,
            guardian,
            tokenExpiration,
            location
        });

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'khanbasha7777777@gmail.com',
                pass: 'jith pqxs yghn llnc'
            }
        });

        const mailOptions = {
            from: 'khanbasha7777777@gmail.com',
            to: email,
            subject: 'Verify Your Email',
            html: `<h4>Hello, ${userName}</h4>
                   <p>Please verify your email by clicking on the link below:</p>
                   <a href="http://localhost:3000/api/auth/verify/${verificationToken}">Verify Email</a>`
        };

        transporter.sendMail(mailOptions, async function(error, info) {
            if (error) {
                console.log(error);
                // Send response for email sending error
                return res.status(500).json({
                    status: 'error',
                    body: null,
                    message: 'Failed to send verification email'
                });
            } else {
                console.log('Email sent: ' + info.response);

                // After sending the email, check if the user is verified and send a welcome notification
                const message = 'Welcome to our platform! We are excited to have you.';
                await createNotification(patient._id, 'Patient', message, null, null, 'message');
                
                // Send response for successful registration and email sending with patient details
                return res.status(201).json({
                    status: 'success',
                    body: {
                        userName: patient.userName,
                        email: patient.email,
                        dateOfBirth: patient.dateOfBirth,
                        address: patient.address,
                        mobile: patient.mobile,
                        guardian: patient.guardian
                    },
                    message: 'Registration successful, please check your email to verify your account.'
                });
            }
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: error.message
        });
    }
};


const verifyEmail = async (req, res) => {
    const { token } = req.params; // Assuming the token is passed as a URL parameter

    try {
        const patient = await Patient.findOne({
            verificationToken: token,
            tokenExpiration: { $gt: Date.now() } // Checks that the token hasn't expired
        });

        if (!patient) {
            return res.status(404).json({ message: 'Verification token is invalid or has expired.' });
        }

        patient.verified = 'yes';
        patient.verificationToken = undefined; // Clear the verification token
        patient.tokenExpiration = undefined; // Clear the token expiration

        await patient.save();
        res.status(200).json({ message: 'Your account has been successfully verified.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

const authPatient = async (req, res) => {
    const { email, password } = req.body;

    try {
        const patient = await Patient.findOne({ email });

        if (!patient) {
            return res.status(401).json({
                status: 'error',
                body: null,
                message: "Invalid email address."
            });
        }

        if (patient.verified !== 'yes') {
            return res.status(401).json({
                status: 'error',
                body: null,
                message: "Your email address has not been verified. Please check your email to verify your account."
            });
        }

        if (await bcrypt.compare(password, patient.password)) {
            const token = generateToken(patient._id);
            return res.json({
                status: 'success',
                body: {
                    patient: {
                        id: patient._id,
                        userName: patient.userName,
                        email: patient.email,
                        verified: patient.verified,
                        dateOfBirth: patient.dateOfBirth,
                        guardian: patient.guardian,
                        mobile: patient.mobile,
                        score: patient.score
                    },
                    token
                },
                message: 'Authentication successful.'
            });
        } else {
            return res.status(401).json({
                status: 'error',
                body: null,
                message: "Invalid password."
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: error.message
        });
    }
};



const registerClinisist = async (req, res) => {
    const { 
        name, email, mobileNum, dob, password, specializedIn, address, services, about,
        image, licenseImage, ratings, experience, location, careerpath, highlights,
        organization, degree, licenseNumber, licenseExpirationDate, npiNumber
    } = req.body;

    try {
        const clinisistExists = await Clinisist.findOne({ email });

        if (clinisistExists) {
            return res.status(400).json({
                status: 'error',
                body: null,
                message: 'User already exists'
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const clinisist = await Clinisist.create({
            name,
            email,
            mobileNum,
            dob,
            password: hashedPassword,
            specializedIn,
            address,
            services,
            about,
            image,
            licenseImage,
            ratings,
            experience,
            location,
            careerpath,
            highlights,
            organization,
            degree,
            licenseNumber,
            licenseExpirationDate,
            npiNumber,
            Active: 'yes'
        });

        if (clinisist) {
            res.status(201).json({
                status: 'success',
                body: {
                    clinisist: {
                        id: clinisist._id,
                        name: clinisist.name,
                        email: clinisist.email,
                        specializedIn: clinisist.specializedIn,
                        // Add other fields as needed
                    },
                    token: generateToken(clinisist._id),
                },
                message: 'Clinisist registered successfully'
            });
        } else {
            res.status(400).json({
                status: 'error',
                body: null,
                message: 'Invalid Details'
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: error.message,
        });
    }
};


const authClinisist = async (req, res) => {
    const { email, password } = req.body;

    try {
        const clinisist = await Clinisist.findOne({ email });

        if (clinisist && (await bcrypt.compare(password, clinisist.password))) {
            res.json({
                clinisist: clinisist,
                token: generateToken(clinisist._id),
            });
        } else if (clinisist) {
            res.status(401).json({
                message: "Invalid Password",
            });
        } else {
            res.status(401).json({
                message: "Invalid emailId",
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: error.message,
        });
    }
};

const sendPasswordResetEmail = async (req, res) => {
    const { email } = req.body;
    try {
        const patient = await Patient.findOne({ email });
        if (!patient) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: "No user found with that email address."
            });
        }

        const resetToken = crypto.randomBytes(20).toString('hex');
        const tokenExpiration = Date.now() + 3600000; // 1 hour before the token expires

        patient.resetPasswordToken = resetToken;
        patient.resetPasswordExpires = tokenExpiration; // Save the expiration time
        await patient.save();

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'khanbasha7777777@gmail.com',
                pass: 'jith pqxs yghn llnc'
            }
        });

        const resetUrl = `http://localhost:3000/api/auth/reset/${resetToken}`;
        const mailOptions = {
            from: 'khanbasha7777777@gmail.com',
            to: email,
            subject: 'Password Reset Request',
            html: `Please click on the following link to reset your password: <a href="${resetUrl}">${resetUrl}</a>`
        };

        transporter.sendMail(mailOptions, function(error, info) {
            if (error) {
                console.log(error);
                return res.status(500).json({
                    status: 'error',
                    body: null,
                    message: 'Error sending email'
                });
            } else {
                return res.status(200).json({
                    status: 'success',
                    body: null,
                    message: 'Password reset email sent.'
                });
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: error.message
        });
    }
};


const resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    try {
        const patient = await Patient.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!patient) {
            return res.status(400).json({
                status: 'error',
                body: null,
                message: 'Password reset token is invalid or has expired.'
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        patient.password = hashedPassword;
        patient.resetPasswordToken = undefined;
        patient.resetPasswordExpires = undefined;
        await patient.save();

        // Create a notification for the patient
        const message = 'Your password has been successfully updated.';
        await createNotification(patient._id, 'Patient', message, null, null, 'alert');

        res.status(200).json({
            status: 'success',
            body: null,
            message: 'Your password has been updated.'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: error.message
        });
    }
};

module.exports = {registerPatient, authPatient,registerClinisist, authClinisist, verifyEmail,resetPassword,sendPasswordResetEmail};
