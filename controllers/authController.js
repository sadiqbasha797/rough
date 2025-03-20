const Patient = require('../models/patient');
const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken');
const Clinisist = require('../models/Clinisist');
const nodemailer = require('nodemailer');
const crypto = require('crypto'); // To generate a token
const createNotification = require('../utils/createNotification');
const { uploadFile } = require('../utils/s3Util');  // Add this line with other requires

const registerPatient = async (req, res) => {
    const { userName, email, password, dateOfBirth, address, mobile, guardian, location } = req.body;
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
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Verify Your Email',
            html: `<h4>Hello, ${userName}</h4>
                   <p>Please verify your email by clicking on the link below:</p>
                   <a href="https://ifeelincolorvps.projexino.com/api/auth/verify/${verificationToken}">Verify Email</a>`
        };

        transporter.sendMail(mailOptions, async function(error, info) {
            if (error) {
                console.log(error);
                return res.status(500).json({
                    status: 'error',
                    body: null,
                    message: 'Failed to send verification email'
                });
            } else {
                console.log('Email sent: ' + info.response);

                const message = 'Welcome to our platform! We are excited to have you.';
                await createNotification(patient._id, 'Patient', message, null, null, 'message');
                
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
    const { token } = req.params;

    try {
        const patient = await Patient.findOne({
            verificationToken: token,
            tokenExpiration: { $gt: Date.now() }
        });

        if (!patient) {
            return res.render('verification-failed', {
                message: 'Verification token is invalid or has expired.'
            });
        }

        patient.verified = 'yes';
        patient.verificationToken = undefined;
        patient.tokenExpiration = undefined;

        await patient.save();
        
        res.render('verification-success', {
            message: 'Your account has been successfully verified.'
        });
    } catch (error) {
        console.error(error);
        res.render('verification-failed', {
            message: 'An error occurred during verification.'
        });
    }
};

const authPatient = async (req, res) => {
    const { email, password, deviceToken } = req.body;

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
            // Update device token if provided
            if (deviceToken && deviceToken !== patient.deviceToken) {
                patient.deviceToken = deviceToken;
                await patient.save();
                console.log('Device token updated for patient:', patient._id);
            }

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
                        score: patient.score,
                        deviceToken: patient.deviceToken
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
    try {
        console.log('Request body:', req.body);
        console.log('Request files:', req.files);
        
        // Updated destructuring to include userName instead of name
        const { 
            userName, email, mobileNum, dob, password, specializedIn, services, about,
            ratings, experience, location, careerpath, highlights,
            organization, degree, licenseNumber, licenseExpirationDate, npiNumber
        } = req.body;

        // Parse address separately
        let address;
        try {
            address = typeof req.body.address === 'string' ? 
                     JSON.parse(req.body.address) : 
                     req.body.address;
        } catch (error) {
            console.error('Error parsing address:', error);
            return res.status(400).json({
                status: 'error',
                body: null,
                message: 'Invalid address format'
            });
        }

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                status: 'error',
                body: null,
                message: 'Email and password are required'
            });
        }

        const clinisistExists = await Clinisist.findOne({ email });

        if (clinisistExists) {
            return res.status(400).json({
                status: 'error',
                body: null,
                message: 'User already exists'
            });
        }

        // Generate hashed password first
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Handle file uploads
        let imageUrl = null;
        let licenseImageUrl = null;
        let frontLicenseUrl = null;
        let backLicenseUrl = null;
    
        if (req.files) {
            if (req.files['image']) {
                const imageFile = req.files['image'][0];
                const imageKey = `doctor_images/${Date.now()}_${imageFile.originalname}`;
                imageUrl = await uploadFile(imageFile.buffer, imageKey, imageFile.mimetype);
            }
    
            if (req.files['licenseImage']) {
                const licenseFile = req.files['licenseImage'][0];
                const licenseKey = `license_images/${Date.now()}_${licenseFile.originalname}`;
                licenseImageUrl = await uploadFile(licenseFile.buffer, licenseKey, licenseFile.mimetype);
            }
    
            if (req.files['front_license']) {
                const frontLicenseFile = req.files['front_license'][0];
                const frontLicenseKey = `license_images/${Date.now()}_front_${frontLicenseFile.originalname}`;
                frontLicenseUrl = await uploadFile(frontLicenseFile.buffer, frontLicenseKey, frontLicenseFile.mimetype);
            }
    
            if (req.files['back_license']) {
                const backLicenseFile = req.files['back_license'][0];
                const backLicenseKey = `license_images/${Date.now()}_back_${backLicenseFile.originalname}`;
                backLicenseUrl = await uploadFile(backLicenseFile.buffer, backLicenseKey, backLicenseFile.mimetype);
            }
        }

        const clinisist = await Clinisist.create({
            name: userName,  // Store userName as name
            email,
            mobileNum,
            dob,
            password: hashedPassword,
            specializedIn,
            address: {
                latitude: address.latitude,
                longitude: address.longitude,
                location: address.location
            },
            services,
            about,
            image: imageUrl,
            licenseImage: licenseImageUrl,
            front_license: frontLicenseUrl,
            back_license: backLicenseUrl,
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
    const { email, password, deviceToken } = req.body;

    try {
        const clinisist = await Clinisist.findOne({ email });

        if (!clinisist) {
            return res.status(401).json({
                status: 'error',
                body: "",
                message: "Invalid emailId",
            });
        }

        if (clinisist.Active !== 'yes') {
            return res.status(401).json({
                status: 'success',
                body: {
                    verified: false,
                    email: clinisist.email
                },
                message: "Your account is pending verification. Please wait for admin approval."
            });
        }

        if (await bcrypt.compare(password, clinisist.password)) {
            // Transform null values to empty strings in clinisist object
            const clinisistData = {
                ...clinisist.toObject(),
                password: undefined,
                image: clinisist.image || "",
                licenseImage: clinisist.licenseImage || "",
                front_license: clinisist.front_license || "",
                back_license: clinisist.back_license || "",
                about: clinisist.about || "",
                services: clinisist.services || "",
                ratings: clinisist.ratings || "",
                experience: clinisist.experience || "",
                careerpath: clinisist.careerpath || "",
                highlights: clinisist.highlights || "",
                organization: clinisist.organization || "",
                degree: clinisist.degree || "",
                licenseNumber: clinisist.licenseNumber || "",
                licenseExpirationDate: clinisist.licenseExpirationDate || "",
                npiNumber: clinisist.npiNumber || "",
                deviceToken: clinisist.deviceToken || ""
            };

            res.json({
                status: 'success',
                body: {
                    clinisist: clinisistData,
                    token: generateToken(clinisist._id),
                },
                message: 'Authentication successful.'
            });
        } else {
            res.status(401).json({
                status: 'error',
                body: "",
                message: "Invalid Password",
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({
            status: 'error',
            body: "",
            message: error.message,
        });
    }
};

const sendPasswordResetEmail = async (req, res) => {
    const { email, userType } = req.body;
    try {
        let user;
        if (userType === 'patient') {
            user = await Patient.findOne({ email });
        } else if (userType === 'clinisist') {
            user = await Clinisist.findOne({ email });
        }

        if (!user) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: "No user found with that email address."
            });
        }

        const resetToken = crypto.randomBytes(20).toString('hex');
        const tokenExpiration = Date.now() + 3600000; // 1 hour before the token expires

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = tokenExpiration;
        await user.save();

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const resetUrl = `https://ifeelincolorvps.projexino.com/api/auth/reset/${resetToken}?userType=${userType}`;
        const mailOptions = {
            from: process.env.EMAIL_USER,
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
    const { password, userType } = req.body;

    try {
        let user;
        if (userType === 'patient') {
            user = await Patient.findOne({
                resetPasswordToken: token,
                resetPasswordExpires: { $gt: Date.now() }
            });
        } else if (userType === 'clinisist') {
            user = await Clinisist.findOne({
                resetPasswordToken: token,
                resetPasswordExpires: { $gt: Date.now() }
            });
        }

        if (!user) {
            return res.status(400).json({
                status: 'error',
                body: null,
                message: 'Password reset token is invalid or has expired.'
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        const message = 'Your password has been successfully updated.';
        if (userType === 'patient') {
            await createNotification(user._id, 'Patient', message, null, null, 'alert');
        } else if (userType === 'clinisist') {
            await createNotification(user._id, 'Clinisist', message, null, null, 'alert');
        }

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

const resendVerificationEmail = async (req, res) => {
    const { email } = req.body;

    try {
        const patient = await Patient.findOne({ email });

        if (!patient) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'No user found with that email address.'
            });
        }

        if (patient.verified === 'yes') {
            return res.status(400).json({
                status: 'error',
                body: null,
                message: 'This email is already verified.'
            });
        }

        // Generate new verification token
        const verificationToken = crypto.randomBytes(20).toString('hex');
        const tokenExpiration = Date.now() + 3600000; // 1 hour

        patient.verificationToken = verificationToken;
        patient.tokenExpiration = tokenExpiration;
        await patient.save();

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Verify Your Email',
            html: `<h4>Hello, ${patient.userName}</h4>
                   <p>Please verify your email by clicking on the link below:</p>
                   <a href="https://ifeelincolorvps.projexino.com/api/auth/verify/${verificationToken}">Verify Email</a>`
        };

        transporter.sendMail(mailOptions, function(error, info) {
            if (error) {
                console.log(error);
                return res.status(500).json({
                    status: 'error',
                    body: null,
                    message: 'Failed to send verification email'
                });
            }
            
            return res.status(200).json({
                status: 'success',
                body: null,
                message: 'Verification email has been resent. Please check your inbox.'
            });
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

module.exports = {
    registerPatient, 
    authPatient, 
    registerClinisist, 
    authClinisist, 
    verifyEmail, 
    resetPassword, 
    sendPasswordResetEmail,
    resendVerificationEmail
};
