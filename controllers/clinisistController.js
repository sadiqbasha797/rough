const Clinisist = require('../models/Clinisist');
const bcrypt = require('bcryptjs');
const Plan = require('../models/plan');
const Patient = require('../models/patient');
const Notification = require('../models/Notification');
const multer = require('multer');
const AWS = require('aws-sdk');
const { uploadFile, deleteFile, getFileUrl } = require('../utils/s3Util');
const storage = multer.memoryStorage(); // Store files in memory temporarily
const upload = multer({ storage: storage });
const Subscription = require('../models/subscription');
const AssessmentInfo = require('../models/assessmentInfo');

// Update Doctor's Image using S3
const updateDoctorImage = async (req, res) => {
    const clinisistId = req.params.id;

    try {
        const clinisist = await Clinisist.findById(clinisistId);
        if (!clinisist) {
            return res.status(404).json({
                status: "error",
                body: null,
                message: 'Clinisist not found'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                status: "error",
                body: null,
                message: 'No image file uploaded'
            });
        }

        // Generate a unique key (filename) for the S3 bucket
        const fileKey = `doctor_images/${Date.now()}_${req.file.originalname}`;

        // Upload the file to S3
        const imageUrl = await uploadFile(req.file.buffer, fileKey, req.file.mimetype);

        // Optionally, delete the previous image from S3 if exists
        if (clinisist.image) {
            const previousKey = clinisist.image.split('/').pop();
            await deleteFile(`doctor_images/${previousKey}`);
        }

        // Update Clinisist's image with the new S3 URL
        clinisist.image = imageUrl;
        await clinisist.save();

        res.status(200).json({
            status: "success",
            body: { imageUrl: clinisist.image },
            message: 'Image updated successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: "error",
            body: null,
            message: error.message
        });
    }
};

const getClinisistProfile = async (req, res) => {
    try {
        // Ensure we are working with a plain JavaScript object
        const clinisistData = req.clinisist.toObject ? req.clinisist.toObject() : req.clinisist;

        res.json({
            status: "success",
            body: clinisistData,
            message: "Clinisist profile retrieved successfully"
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            body: null,
            message: "An error occurred while retrieving the clinisist profile"
        });
    }
};

// Update Password
const updatePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    try {
        const clinisist = await Clinisist.findById(req.clinisist._id);

        if (clinisist && (await bcrypt.compare(oldPassword, clinisist.paswd))) {
            const salt = await bcrypt.genSalt(10);
            clinisist.paswd = await bcrypt.hash(newPassword, salt);
            await clinisist.save();
            res.json({
                status: "success",
                body: null,
                message: "Password changed successfully"
            });
        } else {
            res.status(401).json({
                status: "error",
                body: null,
                message: "Old password not correct"
            });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({
            status: "error",
            body: null,
            message: err.message
        });
    }
};

// Update UserName
const updateUserName = async (req, res) => {
    const { newUserName } = req.body;

    try {
        const clinisist = await Clinisist.findById(req.clinisist._id);

        if (clinisist) {
            clinisist.name = newUserName;
            await clinisist.save();
            res.json({
                status: "success",
                body: null,
                message: "User name updated successfully"
            });
        } else {
            res.status(404).json({
                status: "error",
                body: null,
                message: "Clinisist not found"
            });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({
            status: "error",
            body: null,
            message: err.message
        });
    }
};

// Delete Clinisist
const deleteClinisist = async (req, res) => {
    try {
        const clinisist = await Clinisist.findById(req.clinisist._id);

        if (clinisist) {
            const plans = await Plan.find({ status: 'Active', createdBy: req.clinisist._id });
            if (plans) {
                return res.status(403).json({
                    status: "error",
                    body: null,
                    message: "Can't delete your account while you have Active Plans"
                });
            }
            await Clinisist.deleteOne({ _id: req.clinisist._id });
            res.json({
                status: "success",
                body: null,
                message: "Clinisist deleted successfully"
            });
        } else {
            res.status(404).json({
                status: "error",
                body: null,
                message: "Clinisist not found"
            });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({
            status: "error",
            body: null,
            message: err.message
        });
    }
};

const getNotifications = async (req, res) => {
    try {
        let notifications = await Notification.find({
            'recipient.id': req.clinisist._id,
            'recipient.model': 'Clinisist'
        }).sort({ createdAt: -1 });

        // Populate recipient and sender details for subscription notifications
        notifications = await Promise.all(notifications.map(async (notification) => {
            if (notification.type === 'subscription') {
                const recipient = await Clinisist.findById(notification.recipient.id).select('name email');
                const sender = await Patient.findById(notification.sender.id).select('userName email');
                return {
                    ...notification.toObject(),
                    recipient,
                    sender
                };
            }
            return notification;
        }));

        res.status(200).json({
            status: "success",
            body: notifications,
            message: "Notifications fetched successfully"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: "error",
            body: null,
            message: error.message
        });
    }
};

const updateDoctor = async (req, res) => {
    try {
        const {
            Active, name, email, mobileNum, dob, specializedIn, address, about, services,
            ratings, experience, location, careerpath, highlights, organization,
            degree, licenseNumber, licenseExpirationDate, npiNumber
        } = req.body;

        // Find the clinisist by ID (extracted from the token by middleware)
        const clinisist = await Clinisist.findById(req.clinisist._id);

        if (!clinisist) {
            return res.status(404).json({
                status: "error",
                body: null,
                message: "Clinisist not found"
            });
        }

        // Update the fields
        clinisist.Active = Active || clinisist.Active;
        clinisist.name = name || clinisist.name;
        clinisist.email = email || clinisist.email;
        clinisist.mobileNum = mobileNum || clinisist.mobileNum;
        clinisist.dob = dob || clinisist.dob;
        clinisist.specializedIn = specializedIn || clinisist.specializedIn;
        clinisist.address = address || clinisist.address;
        clinisist.about = about || clinisist.about;
        clinisist.services = services || clinisist.services;
        clinisist.ratings = ratings || clinisist.ratings;
        clinisist.experience = experience || clinisist.experience;
        clinisist.location = location || clinisist.location;
        clinisist.careerpath = careerpath || clinisist.careerpath;
        clinisist.highlights = highlights || clinisist.highlights;
        clinisist.organization = organization || clinisist.organization;
        clinisist.degree = degree || clinisist.degree;
        clinisist.licenseNumber = licenseNumber || clinisist.licenseNumber;
        clinisist.licenseExpirationDate = licenseExpirationDate || clinisist.licenseExpirationDate;
        clinisist.npiNumber = npiNumber || clinisist.npiNumber;

        // Save the updated clinisist details
        await clinisist.save();

        res.status(200).json({
            status: "success",
            body: clinisist,
            message: "Profile updated successfully"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: "error",
            body: null,
            message: "An error occurred while updating the profile"
        });
    }
};

const getSubscribedPatients = async (req, res) => {
    try {
        const clinisistId = req.clinisist._id;

        // Find all subscriptions for this clinisist
        const subscriptions = await Subscription.find({
            clinisist: clinisistId,
            endDate: { $gte: new Date() } // Only active subscriptions
        }).populate('plan');

        // Extract patient IDs from subscriptions
        const patientIds = subscriptions.map(sub => sub.patient);

        // Fetch full patient information
        const patients = await Patient.find({ _id: { $in: patientIds } });

        // Combine patient info with subscription details
        const subscribedPatients = patients.map(patient => {
            const subscription = subscriptions.find(sub => sub.patient.equals(patient._id));
            return {
                patient: patient,
                subscription: {
                    planName: subscription.plan.name,
                    startDate: subscription.startDate,
                    endDate: subscription.endDate,
                    renewal: subscription.renewal
                }
            };
        });

        res.status(200).json({
            status: "success",
            body: subscribedPatients,
            message: "Subscribed patients fetched successfully"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: "error",
            body: null,
            message: "An error occurred while fetching subscribed patients"
        });
    }
};

const getSubscribedPatientsAssessments = async (req, res) => {
    try {
        const clinisistId = req.clinisist._id;

        // Find all active subscriptions for this clinisist
        const subscriptions = await Subscription.find({
            clinisist: clinisistId,
            endDate: { $gte: new Date() }
        }).populate('plan');

        // Extract patient IDs from subscriptions
        const patientIds = subscriptions.map(sub => sub.patient);

        // Fetch patients and their latest assessment info
        const patientsWithAssessments = await Patient.aggregate([
            { $match: { _id: { $in: patientIds } } },
            {
                $lookup: {
                    from: 'assessmentinfos',
                    let: { patientId: '$_id' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$patientId', '$$patientId'] } } },
                        { $sort: { createdAt: -1 } },
                        { $limit: 1 }
                    ],
                    as: 'latestAssessment'
                }
            },
            { $unwind: { path: '$latestAssessment', preserveNullAndEmptyArrays: true } }
        ]);

        // Combine patient info with subscription and assessment details
        const subscribedPatientsWithAssessments = patientsWithAssessments.map(patient => {
            const subscription = subscriptions.find(sub => sub.patient.equals(patient._id));
            return {
                patient: {
                    _id: patient._id,
                    userName: patient.userName,
                    email: patient.email,
                    dateOfBirth: patient.dateOfBirth,
                    mobile: patient.mobile,
                    // Add other patient fields as needed
                },
                subscription: {
                    planName: subscription.plan.name,
                    startDate: subscription.startDate,
                    endDate: subscription.endDate,
                    renewal: subscription.renewal
                },
                latestAssessment: patient.latestAssessment || null
            };
        });

        res.status(200).json({
            status: "success",
            body: subscribedPatientsWithAssessments,
            message: "Subscribed patients' assessments fetched successfully"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: "error",
            body: null,
            message: "An error occurred while fetching subscribed patients' assessments"
        });
    }
};

module.exports = {
    getClinisistProfile,
    updatePassword,
    updateUserName,
    deleteClinisist,
    getNotifications,
    updateDoctorImage,
    upload,
    updateDoctor,
    getSubscribedPatients,
    getSubscribedPatientsAssessments
};