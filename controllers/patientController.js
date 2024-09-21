const Patient = require('../models/patient');
const bcrypt = require('bcryptjs');
const Clinisist = require('../models/Clinisist');
const Notification = require('../models/Notification');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const Subscription = require('../models/subscription');

// Cloudinary configuration
cloudinary.config({
    cloud_name: 'dmst4lbrx',
    api_key: '828194579658255',
    api_secret: '4hij7lz9E3GNXkFgGW6XnvJ1DFo'
});
// Multer storage configuration for Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'patient_images', // Cloudinary folder
        allowedFormats: ['jpg', 'png', 'jpeg'],
    },
});

const upload = multer({ storage: storage });

/*const updatePatientImage = async (req, res) => {
    const patientId = req.params.id;

    try {
        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({
                status: "error",
                body: null,
                message: "Patient not found"
            });
        }

        if (!req.file) {
            return res.status(400).json({
                status: "error",
                body: null,
                message: "No image file uploaded"
            });
        }

        // Update patient's image with the Cloudinary URL
        patient.image = req.file.path;
        await patient.save();

        res.status(200).json({ 
            status: "success",
            body: { imageUrl: patient.image },
            message: "Image updated successfully"
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
*/

const deletePatientImage = async (req, res) => {
    const patientId = req.patient;

    try {
        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({
                status: "error",
                body: null,
                message: "Patient not found"
            });
        }

        if (!patient.image) {
            return res.status(400).json({
                status: "error",
                body: null,
                message: "No image to delete"
            });
        }

        // Extract the public ID from the Cloudinary URL
        const publicId = patient.image.split('/').pop().split('.')[0];

        // Delete the image from Cloudinary
        await cloudinary.uploader.destroy(`patient_images/${publicId}`);

        // Remove the image reference from the patient record
        patient.image = null;
        await patient.save();

        res.status(200).json({
            status: "success",
            body: null,
            message: "Image deleted successfully"
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


const getPatientProfile = async (req, res) => {
    try {
        if (!req.patient) {
            return res.status(404).json({
                status: "error",
                body: null,
                message: "Patient not found"
            });
        }

        const patientData = req.patient._doc || req.patient;

        res.json({
            status: "success",
            body: patientData,
            message: "Patient profile retrieved successfully"
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            body: null,
            message: "An error occurred while retrieving the patient profile"
        });
    }
};




const updatePassword = async (req, res) => {
    const {oldPassword, newPassword} = req.body;

    try {
        const patient = await Patient.findById(req.patient._id);

        if (patient && (await bcrypt.compare(oldPassword, patient.password))) {
            const salt = await bcrypt.genSalt(10);
            patient.password = await bcrypt.hash(newPassword, salt);
            await patient.save();
            res.json({
                message: "Password changed sucesfully"
            });
        } else {
            res.status(401).json({
                message: "OLdpassword not correct"
            });
        }
    } catch(err) {
        console.log(err);
        res.status(500).json({
            message: err.message,
        });
    }
};

const updateUserName = async (req, res) => {
    const {newUsername} = req.body; 

    if (!newUsername) {
        return res.status(401).json({
            message: "New username is empty",
        });
    }

    try {
        const patient = await Patient.findById(req.patient._id);

        if (patient) {
            patient.userName = newUsername;
            await patient.save();
            res.json({
                message: "Username sucesfully updated",
            });
        } else {
            res.status(404).json({
                message: "patient not found",
            });
        }
    } catch(err) {
        res.status(500).json({
            message: err.message,
        });
    }
};

const deletePatient = async (req, res) => {
    try {
        const patient = await Patient.findById(req.patient._id);

        if (patient) {
            await Patient.deleteOne({_id: req.patient._id});
            res.json({
                message: 'Patient deleted sucesfully',
            });
        } else {
            res.status(404).json({
                message: "Patient not found",
            })
        }
    } catch(err) {
        res.status(500).json({
            message: err.message,
        });
    }
};
// Helper function to calculate distance between two coordinates using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const toRadians = (degrees) => degrees * (Math.PI / 180);

    const R = 6371; // Radius of the Earth in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers

    return distance;
};

const getNearestDoctors = async (req, res) => {
    const { latitude, longitude } = req.body;

    // Check if latitude and longitude are provided
    if (latitude === undefined || longitude === undefined) {
        return res.status(400).json({
            status: "error",
            body: null,
            message: "Latitude and longitude are required"
        });
    }

    const maxDistance = req.query.maxDistance || 10; // Default to 10 km if not specified

    try {
        console.log("Finding nearest doctors for coordinates:", latitude, longitude);

        const patientId = req.patient._id;

        // Fetch all subscriptions of the patient, including plan details
        const subscriptions = await Subscription.find({ patient: patientId }).populate('plan');
        const subscribedClinisistMap = new Map();

        subscriptions.forEach(sub => {
            if (sub.clinisist) {  // Check if clinisist is not null
                subscribedClinisistMap.set(sub.clinisist.toString(), sub.plan);
            } else {
                console.warn(`Subscription with ID ${sub._id} has no associated clinisist.`);
            }
        });

        const clinisists = await Clinisist.find({});
        console.log("Total clinicians found:", clinisists.length);

        const nearestClinisists = clinisists
            .filter(clinisist => clinisist.address && clinisist.address.latitude && clinisist.address.longitude) // Ensure valid address exists
            .map(clinisist => {
                const distance = calculateDistance(
                    latitude,
                    longitude,
                    clinisist.address.latitude,
                    clinisist.address.longitude
                );
                console.log(`Distance to ${clinisist.name}:`, distance, "km");

                const isSubscribed = subscribedClinisistMap.has(clinisist._id.toString()) ? 1 : 0;
                const planDetails = subscribedClinisistMap.get(clinisist._id.toString()) || null;

                return {
                    ...clinisist._doc, // Spread operator to include all clinician details
                    distance: distance.toFixed(2), // Include the distance in the response, rounded to 2 decimal places
                    subscribed: isSubscribed, // Include the subscribed field
                    planDetails // Include the plan details if subscribed
                };
            })
            .filter(clinisist => clinisist.distance <= maxDistance);

        console.log("Nearest clinicians found:", nearestClinisists.length);
        res.json({
            status: "success",
            body: nearestClinisists,
            message: "Nearest doctors retrieved successfully"
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            status: "error",
            body: null,
            message: err.message
        });
    }
};



const updatePatient = async (req, res) => {
    const { userName, email, password, dateOfBirth, address, guardian, mobile,location } = req.body;

    try {
        const patient = await Patient.findById(req.patient._id);

        if (!patient) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: "Patient not found"
            });
        }

        if (userName) patient.userName = userName;
        if (email) patient.email = email;
        if (password) {
            const salt = await bcrypt.genSalt(10);
            patient.password = await bcrypt.hash(password, salt);
        }
        if (dateOfBirth) patient.dateOfBirth = new Date(dateOfBirth);
        if (address) patient.address = address;
        if (guardian) patient.guardian = guardian;
        if (mobile) patient.mobile = mobile;
        if (location) patient.location = location;

        const updatedPatient = await patient.save();
        res.status(200).json({
            status: 'success',
            body: updatedPatient,
            message: 'Patient details updated successfully'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: 'error',
            body: null,
            message: err.message
        });
    }
};


const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({
            'recipient.id': req.patient._id,
            'recipient.model': 'Patient'
        }).sort({ createdAt: -1 }); // Sort by most recent first

        res.status(200).json({
            status: "success",
            body: notifications,
            message: "Notifications retrieved successfully"
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

const getAllClinisists = async (req, res) => {
    try {
        const clinisists = await Clinisist.find({});

        const formattedClinisists = clinisists.map(clinisist => {
            return clinisist.toObject ? clinisist.toObject() : clinisist;
        });

        res.status(200).json({
            status: "success",
            body: formattedClinisists,
            message: "All clinicians retrieved successfully"
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            status: "error",
            body: null,
            message: "Failed to retrieve clinicians"
        });
    }
};

const getClinisistById = async (req, res) => {
    try {
        const clinisist = await Clinisist.findById(req.params.id);

        if (!clinisist) {
            return res.status(404).json({
                status: "error",
                body: null,
                message: "Clinician not found"
            });
        }

        const clinisistData = clinisist.toObject ? clinisist.toObject() : clinisist;

        res.status(200).json({
            status: "success",
            body: clinisistData,
            message: "Clinician retrieved successfully"
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            status: "error",
            body: null,
            message: "Failed to retrieve clinician"
        });
    }
};




module.exports = {
    getAllClinisists,
    getClinisistById,
    getPatientProfile,
    updatePassword,
    updateUserName,
    deletePatient,
    getNearestDoctors,
    updatePatient,
    getNotifications,
   // updatePatientImage,
    //upload,
    deletePatientImage
};