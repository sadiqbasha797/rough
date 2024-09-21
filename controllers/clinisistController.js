const Clinisist = require('../models/Clinisist');
const bcrypt = require('bcryptjs');
const Plan = require('../models/plan');
const Patient = require('../models/patient');
const Notification = require('../models/Notification');
const multer = require('multer');
const moment = require('moment');
const AWS = require('aws-sdk');
const { uploadFile, deleteFile, getFileUrl } = require('../utils/s3Util');
const storage = multer.memoryStorage(); // Store files in memory temporarily
const upload = multer({ storage: storage });

// Update Doctor's Image using S3
const updateDoctorImage = async (req, res) => {
    const clinisistId = req.params.id;

    try {
        const clinisist = await Clinisist.findById(clinisistId);
        if (!clinisist) {
            return res.status(404).json({ message: 'Clinisist not found' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No image file uploaded' });
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
            message: 'Image updated successfully',
            imageUrl: clinisist.image
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

const getClinisistProfile = async (req, res) => {
    try {
        // Ensure we are working with a plain JavaScript object
        const clinisistData = req.clinisist.toObject ? req.clinisist.toObject() : req.clinisist;

        if (clinisistData.dob) {
            const date = new Date(clinisistData.dob);
            // Format the date to '13th March 2024'
            clinisistData.dob = moment(date).format('Do MMMM YYYY');
        }

        res.json(clinisistData);
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
            res.json({ message: "Password changed successfully" });
        } else {
            res.status(401).json({ message: "Old password not correct" });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: err.message });
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
            res.json({ message: "User name updated successfully" });
        } else {
            res.status(404).json({ message: "Clinisist not found" });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: err.message });
    }
};

// Delete Clinisist
const deleteClinisist = async (req, res) => {
    try {
        const clinisist = await Clinisist.findById(req.clinisist._id);

        if (clinisist) {
            const plans = await Plan.find({status: 'Active', createdBy: req.clinisist._id});
            if (plans) {
                return res.status(403).json({
                    message: "Can't delete your account while you have Active Plans",
                });
            }
            await Clinisist.deleteOne({_id: req.clinisist._id });
            res.json({ message: "Clinisist deleted successfully" });
        } else {
            res.status(404).json({ message: "Clinisist not found" });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: err.message });
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

        res.status(200).json(notifications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

const updateDoctor = async (req, res) => {
    try {
        const {Active, name, email, mobileNum, dob, specializedIn, address, about, services, ratings, experince, location, careerpath, highlights } = req.body;
        
        // Find the clinisist by ID (extracted from the token by middleware)
        const clinisist = await Clinisist.findById(req.clinisist._id);

        if (!clinisist) {
            return res.status(404).json({ status: "error", message: "Clinisist not found" });
        }

        // Update the fields (excluding password, image, licenseImage, verified)
        clinisist.name = name || clinisist.name;
        clinisist.Active = Active || clinisist.Active;
        clinisist.email = email || clinisist.email;
        clinisist.mobileNum = mobileNum || clinisist.mobileNum;
        clinisist.dob = dob || clinisist.dob;
        clinisist.specializedIn = specializedIn || clinisist.specializedIn;
        clinisist.address = address || clinisist.address;
        clinisist.about = about || clinisist.about;
        clinisist.services = services || clinisist.services;
        clinisist.ratings = ratings || clinisist.ratings;
        clinisist.experince = experince || clinisist.experince;
        clinisist.location = location || clinisist.location;
        clinisist.careerpath = careerpath || clinisist.careerpath;
        clinisist.highlights = highlights || clinisist.highlights;

        // Save the updated clinisist details
        await clinisist.save();

        res.status(200).json({
            status: "success",
            message: "Profile updated successfully",
            body: clinisist
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "An error occurred while updating the profile",
            error: error.message
        });
    }
}


module.exports = {getClinisistProfile, updatePassword, updateUserName, deleteClinisist, getNotifications,updateDoctorImage,upload,updateDoctor };
