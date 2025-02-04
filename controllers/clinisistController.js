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
const mongoose = require('mongoose');
const Recommendation = require('../models/Recommendation'); // Make sure to import your Recommendation model
const calculateDistance = require('../utils/calculateDistance');
const PatientInfo = require('../models/patientInfo');
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
        
        // Compare old password
        const isMatch = await bcrypt.compare(oldPassword, clinisist.password); // Note: changed paswd to password
        
        if (!isMatch) {
            return res.status(401).json({
                status: "error",
                body: null,
                message: "Old password is incorrect"
            });
        }

        // Update password
        const salt = await bcrypt.genSalt(10);
        clinisist.password = await bcrypt.hash(newPassword, salt); // Note: changed paswd to password
        await clinisist.save();

        res.json({
            status: "success",
            body: null,
            message: "Password changed successfully"
        });
    } catch (err) {
        console.error('Password update error:', err);
        res.status(500).json({
            status: "error",
            body: null,
            message: "An error occurred while updating password"
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
        const notifications = await Notification.find({
            'recipient.id': req.clinisist._id,
            'recipient.model': 'Clinisist'
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

        // Fetch patients, their latest assessment info, and patient info
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
            {
                $lookup: {
                    from: 'patientinfos',
                    let: { patientId: '$_id' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$patientId', '$$patientId'] } } }
                    ],
                    as: 'patientInfo'
                }
            },
            { $unwind: { path: '$latestAssessment', preserveNullAndEmptyArrays: true } },
            { $unwind: { path: '$patientInfo', preserveNullAndEmptyArrays: true } }
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
                },
                subscription: {
                    planName: subscription.plan.name,
                    startDate: subscription.startDate,
                    endDate: subscription.endDate,
                    renewal: subscription.renewal
                },
                latestAssessment: patient.latestAssessment || null,
                patientInfo: patient.patientInfo || null
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

const getAssessmentInfoByPatientId = async (req, res) => {
    try {
        const { patientId } = req.params;
        console.log('Searching for assessments with Patient ID:', patientId);

        // Get both assessment infos and patient infos
        const [assessmentInfos, patientInfo] = await Promise.all([
            AssessmentInfo.find({ patientId }).sort({ createdAt: -1 }),
            PatientInfo.findOne({ patientId })
        ]);

        console.log('Assessment infos found:', assessmentInfos);
        console.log('Patient info found:', patientInfo);

        if ((!assessmentInfos || assessmentInfos.length === 0) && !patientInfo) {
            console.log('No information found for Patient ID:', patientId);
            return res.status(404).json({
                status: 'error',
                message: 'No information found for this patient'
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                assessmentInfos,
                patientInfo: patientInfo || null
            },
            message: 'Patient information retrieved successfully'
        });
    } catch (error) {
        console.error('Error fetching patient information:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while fetching patient information',
            error: error.message
        });
    }
};

const getClinicistSubscriptionStats = async (req, res) => {
    try {
        const clinisistId = req.clinisist._id;
        const currentDate = new Date();
        const oneMonthAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, currentDate.getDate());
        const oneYearAgo = new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), currentDate.getDate());

        // Get total subscribed patients
        const totalSubscribedPatients = await Subscription.countDocuments({
            clinisist: clinisistId,
            endDate: { $gte: currentDate }
        });

        // Get subscribed patients from the last month
        const lastMonthSubscribedPatients = await Subscription.countDocuments({
            clinisist: clinisistId,
            startDate: { $gte: oneMonthAgo, $lte: currentDate }
        });

        // Calculate percentage change
        const percentageChange = totalSubscribedPatients > 0 
            ? ((lastMonthSubscribedPatients / totalSubscribedPatients) * 100).toFixed(2)
            : 0;

        // Get monthly subscription data for the past year
        const monthlyData = await Subscription.aggregate([
            {
                $match: {
                    clinisist: clinisistId,
                    startDate: { $gte: oneYearAgo }
                }
            },
            {
                $group: {
                    _id: { 
                        year: { $year: "$startDate" },
                        month: { $month: "$startDate" }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 }
            }
        ]);

        // Format the monthly data
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const charData = monthlyData.map(item => ({
            Month: `${months[item._id.month - 1]} ${item._id.year}`,
            Number: item.count
        }));

        res.status(200).json({
            status: "success",
            body: {
                Subscribed_patients: {
                    Total_subscribed_patients: totalSubscribedPatients,
                    Description: `From past one month ${percentageChange}%`,
                    charData: charData
                }
            },
            message: "Clinicist subscription stats fetched successfully"
        });
    } catch (error) {
        console.error('Error fetching clinicist subscription stats:', error);
        res.status(500).json({
            status: "error",
            body: null,
            message: "An error occurred while fetching clinicist subscription stats"
        });
    }
};

const getClinicistSalesStats = async (req, res) => {
    try {
        const clinisistId = req.clinisist._id;
        const currentDate = new Date();
        const oneMonthAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, currentDate.getDate());
        const oneYearAgo = new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), currentDate.getDate());

        // Get total sales value
        const totalSales = await Subscription.aggregate([
            {
                $match: {
                    clinisist: clinisistId,
                    startDate: { $lte: currentDate },
                    endDate: { $gte: currentDate }
                }
            },
            {
                $lookup: {
                    from: 'plans',
                    localField: 'plan',
                    foreignField: '_id',
                    as: 'planDetails'
                }
            },
            {
                $unwind: '$planDetails'
            },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: '$planDetails.price' }
                }
            }
        ]);

        const totalSalesValue = totalSales.length > 0 ? totalSales[0].totalSales : 0;

        // Get sales from the last month
        const lastMonthSales = await Subscription.aggregate([
            {
                $match: {
                    clinisist: clinisistId,
                    startDate: { $gte: oneMonthAgo, $lte: currentDate }
                }
            },
            {
                $lookup: {
                    from: 'plans',
                    localField: 'plan',
                    foreignField: '_id',
                    as: 'planDetails'
                }
            },
            {
                $unwind: '$planDetails'
            },
            {
                $group: {
                    _id: null,
                    lastMonthSales: { $sum: '$planDetails.price' }
                }
            }
        ]);

        const lastMonthSalesValue = lastMonthSales.length > 0 ? lastMonthSales[0].lastMonthSales : 0;

        // Calculate percentage change
        const percentageChange = totalSalesValue > 0 
            ? ((lastMonthSalesValue / totalSalesValue) * 100).toFixed(2)
            : 0;

        // Get monthly sales data for the past year
        const monthlySalesData = await Subscription.aggregate([
            {
                $match: {
                    clinisist: clinisistId,
                    startDate: { $gte: oneYearAgo }
                }
            },
            {
                $lookup: {
                    from: 'plans',
                    localField: 'plan',
                    foreignField: '_id',
                    as: 'planDetails'
                }
            },
            {
                $unwind: '$planDetails'
            },
            {
                $group: {
                    _id: { 
                        year: { $year: "$startDate" },
                        month: { $month: "$startDate" }
                    },
                    sales: { $sum: '$planDetails.price' }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 }
            }
        ]);

        // Format the monthly data
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const charData = monthlySalesData.map(item => ({
            Month: `${months[item._id.month - 1]} ${item._id.year}`,
            Number: item.sales
        }));

        res.status(200).json({
            status: "success",
            body: {
                Sales: {
                    total_sales_value: totalSalesValue,
                    Description: `From past one month ${percentageChange}%`,
                    charData: charData
                }
            },
            message: "Clinicist sales stats fetched successfully"
        });
    } catch (error) {
        console.error('Error fetching clinicist sales stats:', error);
        res.status(500).json({
            status: "error",
            body: null,
            message: "An error occurred while fetching clinicist sales stats"
        });
    }
};

const getClinicistRecommendationStats = async (req, res) => {
    try {
        const clinisistId = req.clinisist._id;
        const currentDate = new Date();
        const oneMonthAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, currentDate.getDate());
        const oneYearAgo = new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), currentDate.getDate());

        // Get total recommendations
        const totalRecommendations = await Recommendation.countDocuments({
            recommendedBy: clinisistId
        });

        // Get recommendations from the last month
        const lastMonthRecommendations = await Recommendation.countDocuments({
            recommendedBy: clinisistId,
            timestamp: { $gte: oneMonthAgo, $lte: currentDate }
        });

        // Calculate percentage change
        const percentageChange = totalRecommendations > 0 
            ? ((lastMonthRecommendations / totalRecommendations) * 100).toFixed(2)
            : 0;

        // Get monthly recommendation data for the past year
        const monthlyData = await Recommendation.aggregate([
            {
                $match: {
                    recommendedBy: clinisistId,  // Remove mongoose.Types.ObjectId
                    timestamp: { $gte: oneYearAgo }
                }
            },
            {
                $group: {
                    _id: { 
                        year: { $year: "$timestamp" },
                        month: { $month: "$timestamp" }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 }
            }
        ]);

        // Format the monthly data
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const charData = monthlyData.map(item => ({
            Month: `${months[item._id.month - 1]} ${item._id.year}`,
            Number: item.count
        }));

        res.status(200).json({
            status: "success",
            body: {
                Recommended_patients: {
                    total_recommended_value: totalRecommendations,
                    Description: `From past one month ${percentageChange}%`,
                    charData: charData
                }
            },
            message: "Clinicist recommendation stats fetched successfully"
        });
    } catch (error) {
        console.error('Error fetching clinicist recommendation stats:', error);
        res.status(500).json({
            status: "error",
            body: null,
            message: "An error occurred while fetching clinicist recommendation stats"
        });
    }
};

const getNearbySubscribedPatientsAssessments = async (req, res) => {
    try {
        const clinisistId = req.clinisist._id;
        const { maxDistance = 50, latitude, longitude } = req.body; // Changed from req.query to req.body

        // Validate latitude and longitude inputs
        if (!latitude || !longitude) {
            return res.status(400).json({
                status: "error",
                message: "Latitude and longitude are required"
            });
        }

        const clinisistLatitude = parseFloat(latitude);
        const clinisistLongitude = parseFloat(longitude);

        if (isNaN(clinisistLatitude) || isNaN(clinisistLongitude)) {
            return res.status(400).json({
                status: "error",
                message: "Invalid latitude or longitude"
            });
        }

        // Find all active subscriptions for this clinicist
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

        // Filter nearby patients and combine with subscription and assessment details
        const nearbyPatientsWithAssessments = patientsWithAssessments
            .filter(patient => {
                if (!patient.address || !patient.address.latitude || !patient.address.longitude) {
                    return false;
                }
                const distance = calculateDistance(
                    clinisistLatitude,
                    clinisistLongitude,
                    patient.address.latitude,
                    patient.address.longitude
                );
                return distance <= maxDistance;
            })
            .map(patient => {
                const subscription = subscriptions.find(sub => sub.patient.equals(patient._id));
                return {
                    patient: {
                        _id: patient._id,
                        userName: patient.userName,
                        email: patient.email,
                        dateOfBirth: patient.dateOfBirth,
                        mobile: patient.mobile,
                        address: patient.address,
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
            body: nearbyPatientsWithAssessments,
            message: "Nearby subscribed patients' assessments fetched successfully"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: "error",
            body: null,
            message: "An error occurred while fetching nearby subscribed patients' assessments"
        });
    }
};

const getClinicistRecommendationsAndPatients = async (req, res) => {
    try {
        const clinisistId = req.clinisist._id;

        // Fetch all recommendations made by this clinicist
        const recommendations = await Recommendation.find({ recommendedBy: clinisistId })
            .populate('recommendedTo', 'userName email dateOfBirth mobile') // Populate patient details
            .sort({ timestamp: -1 }); // Sort by most recent first

        // Group recommendations by patient
        const patientRecommendations = recommendations.reduce((acc, rec) => {
            const patientId = rec.recommendedTo ? rec.recommendedTo._id.toString() : 'unknown';
            if (!acc[patientId]) {
                acc[patientId] = {
                    patient: rec.recommendedTo ? rec.recommendedTo : { _id: 'unknown', userName: 'Patient not found' },
                    recommendations: []
                };
            }
            acc[patientId].recommendations.push({
                _id: rec._id,
                recommendation: rec.recommendation,
                relatedMedia: rec.relatedMedia,
                recommendedBy: {
                    _id: rec.recommendedBy._id,
                    name: req.clinisist.name
                },
                recommendedTo: rec.recommendedTo._id.toString(),
                type: rec.type,
                timestamp: rec.timestamp
            });
            return acc;
        }, {});

        // Convert to array and format the response
        const formattedResponse = Object.values(patientRecommendations).map(({ patient, recommendations }) => ({
            patient: {
                _id: patient._id,
                userName: patient.userName,
                email: patient.email,
                dateOfBirth: patient.dateOfBirth,
                mobile: patient.mobile
            },
            recommendations: recommendations
        }));

        res.status(200).json({
            status: "success",
            body: formattedResponse,
            message: "Clinicist recommendations and patients fetched successfully"
        });
    } catch (error) {
        console.error('Error fetching clinicist recommendations and patients:', error);
        res.status(500).json({
            status: "error",
            body: null,
            message: "An error occurred while fetching clinicist recommendations and patients"
        });
    }
};

const getClinisistById = async (req, res) => {
    try {
        const clinisist = await Clinisist.findById(req.params.id)
            .select('-password -verificationToken -tokenExpiration -resetPasswordToken -resetPasswordExpires');

        if (!clinisist) {
            return res.status(404).json({
                status: "error", 
                body: null,
                message: "Clinician not found"
            });
        }

        res.status(200).json({
            status: "success",
            body: clinisist,
            message: "Clinician retrieved successfully"
        });

    } catch (error) {
        console.error('Error fetching clinician:', error);
        res.status(500).json({
            status: "error",
            body: null,
            message: "Failed to retrieve clinician",
            error: error.message
        });
    }
};

const updateLicenseImage = async (req, res) => {
    const clinisistId = req.clinisist._id;

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
                message: 'No license image file uploaded'
            });
        }

        // Generate a unique key (filename) for the S3 bucket
        const fileKey = `license_images/${Date.now()}_${req.file.originalname}`;

        // Upload the file to S3
        const imageUrl = await uploadFile(req.file.buffer, fileKey, req.file.mimetype);

        // Optionally, delete the previous license image from S3 if exists
        if (clinisist.licenseImage) {
            const previousKey = clinisist.licenseImage.split('/').pop();
            await deleteFile(`license_images/${previousKey}`);
        }

        // Update Clinisist's license image with the new S3 URL
        clinisist.licenseImage = imageUrl;
        await clinisist.save();

        res.status(200).json({
            status: "success",
            body: { licenseImageUrl: clinisist.licenseImage },
            message: 'License image updated successfully'
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
    getSubscribedPatientsAssessments,
    getAssessmentInfoByPatientId,
    getClinicistSubscriptionStats,
    getClinicistSalesStats,
    getClinicistRecommendationStats,
    getNearbySubscribedPatientsAssessments,
    getClinicistRecommendationsAndPatients,
    getClinisistById,
    updateLicenseImage
};
