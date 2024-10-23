const Admin = require('../models/admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Patient = require('../models/patient');
const Clinisist = require('../models/Clinisist');
const passport = require('passport');
const Plan = require('../models/plan');
const Subscription = require('../models/subscription');
const moment = require('moment');
const mongoose = require('mongoose');
const AssessmentInfo = require('../models/assessmentInfo');
const Organization = require('../models/organization');
const OrganizationSubscription = require('../models/org-subsciption');
const ClinicianSubscription = require('../models/clinisistSubscription');
const updateAdminName = async(req, res) => {
    const {newName} = req.body;

    try {
        const admin = await Admin.findById(req.admin._id);

        if (admin) {
            admin.name = newName;
            await admin.save();
            return res.status(200).json({
                status: 'success',
                body: { name: admin.name },
                message: 'Name updated successfully',
            });
        } else {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'Admin not found',
            });
        }
    } catch (err) {
        return res.status(500).json({
            status: 'error',
            body: null,
            message: err.message,
        });
    }
};

const updateAdminPassword = async (req, res) => {
    const {oldPassword, newPassword} = req.body;

    try {
        const admin = await Admin.findById(req.admin._id);

        if (admin && (await bcrypt.compare(oldPassword, admin.password))) {
            const salt = await bcrypt.genSalt(10);
            admin.password = await bcrypt.hash(newPassword, salt);
            await admin.save();
            return res.status(200).json({
                status: 'success',
                body: null,
                message: "Password changed successfully",
            });
        } else {
            return res.status(401).json({
                status: 'error',
                body: null,
                message: 'Old password is incorrect',
            });
        }
    } catch (err) {
        return res.status(500).json({
            status: 'error',
            body: null,
            message: err.message,
        });
    }
};

const getAllOrganizations = async (req, res) => {
    try {
        const organizations = await Organization.find();
        if (organizations.length === 0) {
            return res.status(200).json({
                status: 'success',
                body: [],
                message: 'No organizations found',
            });
        }
        return res.status(200).json({
            status: 'success',
            body: organizations,
            message: 'Organizations fetched successfully',
        });
    } catch (err) {
        return res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error fetching organizations: ' + err.message,
        });
    }
};

const getOrganizationStats = async (req, res) => {
    try {
        const totalCount = await Organization.countDocuments();
        const activeCount = await Organization.countDocuments({ active: true });
        const inactiveCount = await Organization.countDocuments({ active: false });

        return res.status(200).json({
            status: 'success',
            body: {
                totalOrganizations: totalCount,
                activeOrganizations: activeCount,
                inactiveOrganizations: inactiveCount
            },
            message: 'Organization statistics fetched successfully',
        });
    } catch (err) {
        return res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error fetching organization statistics: ' + err.message,
        });
    }
};

const registerAdmin = async (req, res) => {
    const {name, email, password} = req.body;

    try {
        const adminExists = await Admin.findOne({ email });

        if (adminExists) {
            return res.status(400).json({
                status: 'error',
                body: null,
                message: 'Admin already exists',
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const admin = await Admin.create({
            name,
            email,
            password: hashedPassword,
        });

        
        if (admin) {
            res.status(201).json({
                status: 'success',
                body: {
                    id: admin._id,
                    name: admin.name,
                    email: admin.email,
                    token: jwt.sign({ id: admin._id}, process.env.JWT_SECRET, {
                        expiresIn: '1d',
                    }),
                },
                message: 'Admin registered successfully',
            });
        } else {
            res.status(400).json({
                status: 'error',
                body: null,
                message: 'Invalid admin data'
            });
        }
    } catch(err) {
        console.log(err.message);
        res.status(500).json({
            status: 'error',
            body: null,
            message: err.message,
        });
    }
};

const getPatients = async (req, res) => {
    try {
        const patients = await Patient.find();
        return res.status(200).json({
            status: 'success',
            body: patients,
            message: 'Patients fetched successfully',
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching patients', error: error.message });
    }
};

const getDoctors = async (req, res) => {
    try {
        const clinisists = await Clinisist.find();
        return res.status(200).json({
            status: 'success',
            body: clinisists,
            message: 'Doctors fetched successfully',
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching doctors', error: error.message });
    }
};

const verifyDoctor = async (req, res) => {
    try {
        const clinicianId = req.params.id;
        
        const clinician = await Clinisist.findById(clinicianId);
        
        if (!clinician) {
            return res.status(404).json({ message: 'Clinician not found' });
        }
        clinician.verified = 'yes';
        const updatedClinician = await clinician.save();
        
        res.status(200).json({ 
            message: 'Clinician verified successfully',
            clinician: updatedClinician
        });
    } catch (error) {
        console.error('Error verifying clinician:', error);
        res.status(500).json({ message: 'Error verifying clinician', error: error.message });
    }
};

const loginAdmin = (req, res, next) => {
    passport.authenticate('local', (err, admin, info) => {
        if (err) {
            return next(err);
        }
        if (!admin) {
            return res.status(400).json({
                message: 'Invalid Credentials',
            });
        }
        req.login(admin, {session: false}, (err) => {
            if (err) {
                return next(err);
            }
            const token = jwt.sign({id: admin._id}, process.env.JWT_SECRET, {
                expiresIn: '1d',
            });

            return res.json({token, role : "Admin", email : admin.email});
        });
    })(req, res, next);
};

const getPortalPlans = async (req, res) => {
    try {
        const portalPlans = await Plan.find({ planType: 'portal-plan' })
                                      .sort({ createdAt: -1 }); // Sort by creation date, newest first

        if (portalPlans.length === 0) {
            return res.status(200).json({
                status: 'success',
                body : [],
                message: 'No portal plans found',
            });
        }

        res.status(200).json({
            status: 'success',
            body : portalPlans,
            message: 'Portal plans retrieved successfully',
        });
    } catch (error) {
        console.error('Error fetching portal plans:', error);
        res.status(500).json({
            status: 'error',
            error: error.message,
            message: 'An error occurred while fetching portal plans',
        });
    }
};

const getPortalPlanById = async (req, res) => {
    try {
        const planId = req.params.id;
        const plan = await Plan.findOne({ _id: planId, planType: 'portal-plan' });

        if (!plan) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'Portal plan not found',
            });
        }

        res.status(200).json({
            status: 'success',
            body: plan,
            message: 'Portal plan retrieved successfully',
        });
    } catch (error) {
        console.error('Error fetching portal plan:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'An error occurred while fetching the portal plan: ' + error.message
        });
    }
};

const updatePortalPlan = async (req, res) => {
    try {
        const planId = req.params.id;
        const updateData = req.body;

        // Ensure only allowed fields are updated
        const allowedUpdates = ['name', 'price', 'details', 'validity', 'status'];
        const actualUpdates = Object.keys(updateData)
            .filter(update => allowedUpdates.includes(update))
            .reduce((obj, key) => {
                obj[key] = updateData[key];
                return obj;
            }, {});

        const plan = await Plan.findOneAndUpdate(
            { _id: planId, planType: 'portal-plan' },
            actualUpdates,
            { new: true, runValidators: true }
        );

        if (!plan) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'Portal plan not found',
            });
        }

        res.status(200).json({
            status: 'success',
            body: plan,
            message: 'Portal plan updated successfully',
        });
    } catch (error) {
        console.error('Error updating portal plan:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'An error occurred while updating the portal plan: ' + error.message
        });
    }
};

const deletePortalPlan = async (req, res) => {
    try {
        const planId = req.params.id;
        const plan = await Plan.findOneAndDelete({ _id: planId, planType: 'portal-plan' });

        if (!plan) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'Portal plan not found',
            });
        }

        res.status(200).json({
            status: 'success',
            body: plan,
            message: 'Portal plan deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting portal plan:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'An error occurred while deleting the portal plan: ' + error.message
        });
    }
};

const getPortalPlanSubscriptions = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let dateFilter = {};

        if (startDate && endDate) {
            dateFilter = {
                startDate: { $gte: new Date(startDate) },
                endDate: { $lte: new Date(endDate) }
            };
        } else {
            const currentYear = new Date().getFullYear();
            dateFilter = {
                startDate: { $gte: new Date(currentYear, 0, 1) },
                endDate: { $lte: new Date(currentYear, 11, 31) }
            };
        }

        const subscriptions = await Subscription.find({
            ...dateFilter,
            plan: { $in: await Plan.find({ planType: 'portal-plan' }).distinct('_id') }
        })
        .populate('patient') // Populate patient details
        .populate('plan')
        .sort({ startDate: -1 });

        res.status(200).json({
            status: 'success',
            body: subscriptions,
            count: subscriptions.length,
            message: 'Portal plan subscriptions retrieved successfully',
           
        });
    } catch (error) {
        console.error('Error fetching portal plan subscriptions:', error);
        res.status(500).json({
            status: 'error',
            error: error.message,
            message: 'An error occurred while fetching portal plan subscriptions',
        });
    }
};

const getPortalPlanSubscriptionCounts = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let dateFilter = {};
        let year;

        if (startDate && endDate) {
            dateFilter = {
                startDate: { $gte: new Date(startDate) },
                endDate: { $lte: new Date(endDate) }
            };
            year = new Date(startDate).getFullYear();
        } else {
            year = new Date().getFullYear();
            dateFilter = {
                startDate: { $gte: new Date(year, 0, 1) },
                endDate: { $lte: new Date(year, 11, 31) }
            };
        }

        const portalPlanIds = await Plan.find({ planType: 'portal-plan' }).distinct('_id');

        const subscriptions = await Subscription.aggregate([
            {
                $match: {
                    ...dateFilter,
                    plan: { $in: portalPlanIds }
                }
            },
            {
                $group: {
                    _id: { $month: "$startDate" },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        const monthlyData = {};
        for (let i = 1; i <= 12; i++) {
            const monthStr = i.toString().padStart(2, '0');
            monthlyData[`${year}-${monthStr}`] = 0;
        }

        subscriptions.forEach(sub => {
            const monthStr = sub._id.toString().padStart(2, '0');
            monthlyData[`${year}-${monthStr}`] = sub.count;
        });

        const totalCount = Object.values(monthlyData).reduce((a, b) => a + b, 0);

        res.status(200).json({
            status: 'success',
            body: {
                monthlyData,
                totalCount
            },
            message: 'Portal plan subscription counts retrieved successfully',
        });
    } catch (error) {
        console.error('Error fetching portal plan subscription counts:', error);
        res.status(500).json({
            status: 'error',
            error: error.message,
            message: 'An error occurred while fetching portal plan subscription counts',
        });
    }
};
const getPortalPlanEarnings = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let dateFilter = {};
        let year;

        if (startDate && endDate) {
            dateFilter = {
                startDate: { $gte: new Date(startDate) },
                endDate: { $lte: new Date(endDate) }
            };
            year = new Date(startDate).getFullYear();
        } else {
            year = new Date().getFullYear();
            dateFilter = {
                startDate: { $gte: new Date(year, 0, 1) },
                endDate: { $lte: new Date(year, 11, 31) }
            };
        }

        const portalPlanIds = await Plan.find({ planType: 'portal-plan' }).distinct('_id');

        const earnings = await Subscription.aggregate([
            {
                $match: {
                    ...dateFilter,
                    plan: { $in: portalPlanIds }
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
                    earnings: { $sum: "$planDetails.price" }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1 }
            }
        ]);

        const monthlyEarnings = {};
        for (let i = 1; i <= 12; i++) {
            const monthStr = i.toString().padStart(2, '0');
            monthlyEarnings[`${year}-${monthStr}`] = 0;
        }

        earnings.forEach(earning => {
            const monthStr = earning._id.month.toString().padStart(2, '0');
            const yearStr = earning._id.year.toString();
            const key = `${yearStr}-${monthStr}`;
            if (key in monthlyEarnings) {
                monthlyEarnings[key] = earning.earnings;
            }
        });

        const totalEarnings = Object.values(monthlyEarnings).reduce((a, b) => a + b, 0);

        res.status(200).json({
            status: 'success',
            body: {
                monthlyEarnings,
                totalEarnings
            },
            message: 'Portal plan earnings retrieved successfully',
        });
    } catch (error) {
        console.error('Error fetching portal plan earnings:', error);
        res.status(500).json({
            status: 'error',
            error: error.message,
            message: 'An error occurred while fetching portal plan earnings',
        });
    }
};

const getPortalPlanEarningsSummary = async (req, res) => {
    try {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed

        const portalPlanIds = await Plan.find({ planType: 'portal-plan' }).distinct('_id');

        const earnings = await Subscription.aggregate([
            {
                $match: {
                    plan: { $in: portalPlanIds },
                    startDate: { $lte: now },
                    endDate: { $gte: now }
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
                    currentMonthEarnings: {
                        $sum: {
                            $cond: [
                                { $and: [
                                    { $eq: [{ $year: '$startDate' }, currentYear] },
                                    { $eq: [{ $month: '$startDate' }, currentMonth] }
                                ]},
                                '$planDetails.price',
                                0
                            ]
                        }
                    },
                    currentYearEarnings: {
                        $sum: {
                            $cond: [
                                { $eq: [{ $year: '$startDate' }, currentYear] },
                                '$planDetails.price',
                                0
                            ]
                        }
                    },
                    totalEarnings: { $sum: '$planDetails.price' },
                    totalSubscriptions: { $sum: 1 }
                }
            }
        ]);

        const result = earnings[0] || {
            currentMonthEarnings: 0,
            currentYearEarnings: 0,
            totalEarnings: 0,
            totalSubscriptions: 0
        };

        res.status(200).json({
            status: 'success',
            body: {
                currentMonth: {
                    month: currentMonth,
                    year: currentYear,
                    earnings: result.currentMonthEarnings
                },
                currentYear: {
                    year: currentYear,
                    earnings: result.currentYearEarnings
                },
                total: {
                    earnings: result.totalEarnings,
                    subscriptions: result.totalSubscriptions
                }
            },
            message: 'Portal plan earnings summary retrieved successfully',
        });
    } catch (error) {
        console.error('Error fetching portal plan earnings summary:', error);
        res.status(500).json({
            status: 'error',
            error: error.message,
            message: 'An error occurred while fetching portal plan earnings summary',
        });
    }
};

// Fetch all portal clinicians
const getPortalClinicians = async (req, res) => {
    try {
        const clinicians = await Clinisist.find({ organization: null });
        res.status(200).json({
            status: 'success',
            body: clinicians,
            message: 'Portal clinicians retrieved successfully',
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error fetching portal clinicians',
            error: error.message
        });
    }
};

// Update a portal clinician
const updatePortalClinician = async (req, res) => {
    try {
        const clinicianId = req.params.id;
        const updateData = req.body;

        const clinician = await Clinisist.findOneAndUpdate(
            { _id: clinicianId, organization: null },
            updateData,
            { new: true, runValidators: true }
        );

        if (!clinician) {
            return res.status(404).json({
                status: 'error',
                message: 'Portal clinician not found',
            });
        }

        res.status(200).json({
            status: 'success',
            body: clinician,
            message: 'Portal clinician updated successfully',
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error updating portal clinician',
            error: error.message
        });
    }
};

// Delete a portal clinician
const deletePortalClinician = async (req, res) => {
    try {
        const clinicianId = req.params.id;
        const clinician = await Clinisist.findOneAndDelete({ _id: clinicianId, organization: null });

        if (!clinician) {
            return res.status(404).json({
                status: 'error',
                message: 'Portal clinician not found',
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Portal clinician deleted successfully',
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error deleting portal clinician',
            error: error.message
        });
    }
};

// Get counts of active, inactive, and total portal clinicians
const getPortalClinicianCounts = async (req, res) => {
    try {
        const totalCount = await Clinisist.countDocuments({ organization: null });
        const activeCount = await Clinisist.countDocuments({ organization: null, Active: 'yes' });
        const inactiveCount = await Clinisist.countDocuments({ organization: null, Active: 'no' });

        res.status(200).json({
            status: 'success',
            body: {
                total: totalCount,
                activeCount: activeCount,
                inactiveCount: inactiveCount
            },
            message: 'Portal clinician counts retrieved successfully',
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error fetching portal clinician counts',
            error: error.message
        });
    }
};

const getPortalPlanPatientAssessments = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let dateFilter = {};

        if (startDate && endDate) {
            dateFilter = {
                startDate: { $lte: new Date(endDate) },
                endDate: { $gte: new Date(startDate) }
            };
        } else {
            const currentYear = new Date().getFullYear();
            dateFilter = {
                startDate: { $lte: new Date(currentYear, 11, 31) },
                endDate: { $gte: new Date(currentYear, 0, 1) }
            };
        }

        // Get portal plan IDs
        const portalPlanIds = await Plan.find({ planType: 'portal-plan' }).distinct('_id');

        // Get subscribed patients
        const subscriptions = await Subscription.find({
            ...dateFilter,
            plan: { $in: portalPlanIds }
        }).distinct('patient');

        // Get assessment info for subscribed patients
        const assessments = await AssessmentInfo.find({
            patientId: { $in: subscriptions }
        }).populate('patientId', 'userName email');

        // Group assessments by patient
        const groupedAssessments = assessments.reduce((acc, assessment) => {
            const patientId = assessment.patientId._id.toString();
            if (!acc[patientId]) {
                acc[patientId] = {
                    patient: {
                        id: patientId,
                        userName: assessment.patientId.userName,
                        email: assessment.patientId.email
                    },
                    assessments: []
                };
            }
            acc[patientId].assessments.push({
                id: assessment._id,
                mood: assessment.mood,
                moodLevel: assessment.moodLevel,
                createdAt: assessment.createdAt
            });
            return acc;
        }, {});

        const result = Object.values(groupedAssessments);

        res.status(200).json({
            status: 'success',
            body: result,
            count: result.length,
            message: 'Portal plan patient assessments retrieved successfully',
        });
    } catch (error) {
        console.error('Error fetching portal plan patient assessments:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'An error occurred while fetching portal plan patient assessments',
            error: error.message
        });
    }
};

const getAllAssessmentInfos = async (req, res) => {
    try {
        const { startDate, endDate, page = 1, limit = 10 } = req.query;
        let dateFilter = {};

        if (startDate && endDate) {
            dateFilter = {
                createdAt: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            };
        }

        const totalCount = await AssessmentInfo.countDocuments(dateFilter);
        const totalPages = Math.ceil(totalCount / limit);

        const assessments = await AssessmentInfo.find(dateFilter)
            .populate('patientId')  // Populate the entire patient document
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const formattedAssessments = assessments.map(assessment => ({
            assessment: {
                id: assessment._id,
                mood: assessment.mood,
                moodLevel: assessment.moodLevel,
                createdAt: assessment.createdAt,
                updatedAt: assessment.updatedAt,
                // Include any other fields from the AssessmentInfo model
            },
            patient: assessment.patientId  // This now includes the entire patient document
        }));

        res.status(200).json({
            status: 'success',
            body: formattedAssessments,
            message: 'All assessment information retrieved successfully',
        });
    } catch (error) {
        console.error('Error fetching all assessment information:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'An error occurred while fetching all assessment information',
            error: error.message
        });
    }
};

const getDoctorPlanSubscriptions = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let dateFilter = {};

        if (startDate && endDate) {
            dateFilter = {
                startDate: { $gte: new Date(startDate) },
                endDate: { $lte: new Date(endDate) }
            };
        } else {
            const currentYear = new Date().getFullYear();
            dateFilter = {
                startDate: { $gte: new Date(currentYear, 0, 1) },
                endDate: { $lte: new Date(currentYear, 11, 31) }
            };
        }

        const subscriptions = await Subscription.find({
            ...dateFilter,
            plan: { $in: await Plan.find({ planType: 'doctor-plan' }).distinct('_id') }
        })
        .populate('clinisist', 'name email') // Populate clinician details
        .populate('plan')
        .sort({ startDate: -1 });

        res.status(200).json({
            status: 'success',
            body: subscriptions,
            count: subscriptions.length,
            message: 'Doctor plan subscriptions retrieved successfully',
        });
    } catch (error) {
        console.error('Error fetching doctor plan subscriptions:', error);
        res.status(500).json({
            status: 'error',
            error: error.message,
            message: 'An error occurred while fetching doctor plan subscriptions',
        });
    }
};

const getDoctorPlanSubscriptionsMonthWise = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let dateFilter = {};
        let year;

        if (startDate && endDate) {
            dateFilter = {
                startDate: { $gte: new Date(startDate) },
                endDate: { $lte: new Date(endDate) }
            };
            year = new Date(startDate).getFullYear();
        } else {
            year = new Date().getFullYear();
            dateFilter = {
                startDate: { $gte: new Date(year, 0, 1) },
                endDate: { $lte: new Date(year, 11, 31) }
            };
        }

        const subscriptions = await Subscription.aggregate([
            {
                $match: {
                    ...dateFilter,
                    clinisist: { $ne: null },
                    organization: null
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
                $match: {
                    'planDetails.planType': 'doctor-plan'
                }
            },
            {
                $group: {
                    _id: { $month: "$startDate" },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        const monthlyData = {};
        for (let i = 1; i <= 12; i++) {
            const monthStr = i.toString().padStart(2, '0');
            monthlyData[`${year}-${monthStr}`] = 0;
        }

        subscriptions.forEach(sub => {
            const monthStr = sub._id.toString().padStart(2, '0');
            monthlyData[`${year}-${monthStr}`] = sub.count;
        });

        const totalCount = Object.values(monthlyData).reduce((a, b) => a + b, 0);

        res.status(200).json({
            status: 'success',
            body: {
                monthlyData,
                totalCount
            },
            message: 'Doctor plan subscription counts retrieved successfully',
        });
    } catch (error) {
        console.error('Error fetching doctor plan subscription counts:', error);
        res.status(500).json({
            status: 'error',
            error: error.message,
            message: 'An error occurred while fetching doctor plan subscription counts',
        });
    }
};

const getAllSubscriptions = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let dateFilter = {};

        if (startDate && endDate) {
            dateFilter = {
                startDate: { $gte: new Date(startDate) },
                endDate: { $lte: new Date(endDate) }
            };
        } else {
            const currentYear = new Date().getFullYear();
            dateFilter = {
                startDate: { $gte: new Date(currentYear, 0, 1) },
                endDate: { $lte: new Date(currentYear, 11, 31) }
            };
        }

        const subscriptions = await Subscription.find(dateFilter)
            .populate('patient', 'userName email')
            .populate('clinisist', 'name email')
            .populate('plan')
            .sort({ startDate: -1 });

        res.status(200).json({
            status: 'success',
            body: subscriptions,
            count: subscriptions.length,
            message: 'All subscriptions retrieved successfully',
        });
    } catch (error) {
        console.error('Error fetching all subscriptions:', error);
        res.status(500).json({
            status: 'error',
            error: error.message,
            message: 'An error occurred while fetching all subscriptions',
        });
    }
};

const getAllSubscriptionsMonthWise = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let dateFilter = {};
        let year;

        if (startDate && endDate) {
            dateFilter = {
                startDate: { $gte: new Date(startDate) },
                endDate: { $lte: new Date(endDate) }
            };
            year = new Date(startDate).getFullYear();
        } else {
            year = new Date().getFullYear();
            dateFilter = {
                startDate: { $gte: new Date(year, 0, 1) },
                endDate: { $lte: new Date(year, 11, 31) }
            };
        }

        const subscriptions = await Subscription.aggregate([
            {
                $match: dateFilter
            },
            {
                $group: {
                    _id: { $month: "$startDate" },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        const monthlyData = {};
        for (let i = 1; i <= 12; i++) {
            const monthStr = i.toString().padStart(2, '0');
            monthlyData[`${year}-${monthStr}`] = 0;
        }

        subscriptions.forEach(sub => {
            const monthStr = sub._id.toString().padStart(2, '0');
            monthlyData[`${year}-${monthStr}`] = sub.count;
        });

        const totalCount = Object.values(monthlyData).reduce((a, b) => a + b, 0);

        res.status(200).json({
            status: 'success',
            body: {
                monthlyData,
                totalCount
            },
            message: 'All subscription counts retrieved successfully',
        });
    } catch (error) {
        console.error('Error fetching all subscription counts:', error);
        res.status(500).json({
            status: 'error',
            error: error.message,
            message: 'An error occurred while fetching all subscription counts',
        });
    }
};

const getPortalSubscriptionsMonthWise = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let dateFilter = {};
        let year;

        if (startDate && endDate) {
            dateFilter = {
                startDate: { $gte: new Date(startDate) },
                endDate: { $lte: new Date(endDate) }
            };
            year = new Date(startDate).getFullYear();
        } else {
            year = new Date().getFullYear();
            dateFilter = {
                startDate: { $gte: new Date(year, 0, 1) },
                endDate: { $lte: new Date(year, 11, 31) }
            };
        }

        const subscriptions = await Subscription.aggregate([
            {
                $match: {
                    ...dateFilter,
                    organization: null
                }
            },
            {
                $group: {
                    _id: { $month: "$startDate" },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        const monthlyData = {};
        for (let i = 1; i <= 12; i++) {
            const monthStr = i.toString().padStart(2, '0');
            monthlyData[`${year}-${monthStr}`] = 0;
        }

        subscriptions.forEach(sub => {
            const monthStr = sub._id.toString().padStart(2, '0');
            monthlyData[`${year}-${monthStr}`] = sub.count;
        });

        const totalCount = Object.values(monthlyData).reduce((a, b) => a + b, 0);

        res.status(200).json({
            status: 'success',
            body: {
                monthlyData,
                totalCount
            },
            message: 'Portal subscription counts retrieved successfully',
        });
    } catch (error) {
        console.error('Error fetching portal subscription counts:', error);
        res.status(500).json({
            status: 'error',
            error: error.message,
            message: 'An error occurred while fetching portal subscription counts',
        });
    }
};

const getDoctorPlanSubscriptionsWithDetails = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let dateFilter = {};

        if (startDate && endDate) {
            dateFilter = {
                startDate: { $gte: new Date(startDate) },
                endDate: { $lte: new Date(endDate) }
            };
        } else {
            const currentYear = new Date().getFullYear();
            dateFilter = {
                startDate: { $gte: new Date(currentYear, 0, 1) },
                endDate: { $lte: new Date(currentYear, 11, 31) }
            };
        }

        // Find doctor plan subscriptions
        const subscriptions = await Subscription.find({
            ...dateFilter,
            plan: { $in: await Plan.find({ planType: 'doctor-plan' }).distinct('_id') }
        })
        .populate('plan')
        .populate('clinisist')
        .populate('patient')
        .sort({ startDate: -1 });

        // Format the response
        const formattedSubscriptions = subscriptions.map(subscription => ({
            subscription: {
                _id: subscription._id,
                startDate: subscription.startDate,
                endDate: subscription.endDate,
                createdAt: subscription.createdAt,
                updatedAt: subscription.updatedAt,
                // Include any other fields from the Subscription model
            },
            plan: subscription.plan,
            clinician: subscription.clinisist,
            patient: subscription.patient
        }));

        res.status(200).json({
            status: 'success',
            body: formattedSubscriptions,
            count: formattedSubscriptions.length,
            message: 'Doctor plan subscriptions with full details retrieved successfully',
        });
    } catch (error) {
        console.error('Error fetching doctor plan subscriptions with details:', error);
        res.status(500).json({
            status: 'error',
            error: error.message,
            message: 'An error occurred while fetching doctor plan subscriptions with details',
        });
    }
};
// Calculate total earnings for patient, clinician, and organization subscriptions
const calculateTotalEarnings = async (req, res) => {
    try {
        // Calculate patient earnings (portal-plan + doctor-plan)
        const patientEarnings = await Subscription.aggregate([
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
                    totalEarnings: { $sum: '$planDetails.price' }
                }
            }
        ]);

        // Calculate clinician subscription earnings
        const clinicianEarnings = await ClinicianSubscription.aggregate([
            {
                $group: {
                    _id: null,
                    totalEarnings: { $sum: '$price' }
                }
            }
        ]);

        // Calculate organization subscription earnings
        const organizationEarnings = await OrganizationSubscription.aggregate([
            {
                $group: {
                    _id: null,
                    totalEarnings: { $sum: '$price' }
                }
            }
        ]);

        const patientTotal = patientEarnings.length > 0 ? patientEarnings[0].totalEarnings : 0;
        const clinicianTotal = clinicianEarnings.length > 0 ? clinicianEarnings[0].totalEarnings : 0;
        const organizationTotal = organizationEarnings.length > 0 ? organizationEarnings[0].totalEarnings : 0;

        res.status(200).json({
            status: 'success',
            data: {
                patientEarnings: patientTotal,
                clinicianEarnings: clinicianTotal,
                organizationEarnings: organizationTotal,
                totalEarnings: patientTotal + clinicianTotal + organizationTotal
            },
            message: 'Total earnings calculated successfully for patient, clinician, and organization subscriptions'
        });
    } catch (error) {
        console.error('Error calculating total earnings:', error);
        res.status(500).json({
            status: 'error',
            error: error.message,
            message: 'An error occurred while calculating total earnings'
        });
    }
};

const getSubscriptionCountsMonthWise = async (req, res) => {
    try {
        let { startDate, endDate } = req.query;

        // If no dates are provided, default to the current year
        if (!startDate || !endDate) {
            const currentYear = new Date().getFullYear();
            startDate = `${currentYear}-01-01`;
            endDate = `${currentYear}-12-31`;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        // Aggregate for patient subscriptions (formerly portal-plan and doctor-plan subscriptions)
        const patientSubscriptionCounts = await Subscription.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1 }
            }
        ]);

        // Aggregate for organization subscriptions
        const organizationSubscriptionCounts = await OrganizationSubscription.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1 }
            }
        ]);

        // Aggregate for clinician subscriptions
        const clinicianSubscriptionCounts = await ClinicianSubscription.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1 }
            }
        ]);

        const formattedResults = {};

        // Initialize all months with zero counts
        for (let year = start.getFullYear(); year <= end.getFullYear(); year++) {
            const startMonth = year === start.getFullYear() ? start.getMonth() + 1 : 1;
            const endMonth = year === end.getFullYear() ? end.getMonth() + 1 : 12;

            for (let month = startMonth; month <= endMonth; month++) {
                const date = `${year}-${month.toString().padStart(2, '0')}`;
                formattedResults[date] = {
                    patientSubscriptionCount: 0,
                    organizationSubscriptionCount: 0,
                    clinicianSubscriptionCount: 0
                };
            }
        }

        // Populate the results
        patientSubscriptionCounts.forEach(item => {
            const date = `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`;
            formattedResults[date].patientSubscriptionCount = item.count;
        });

        organizationSubscriptionCounts.forEach(item => {
            const date = `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`;
            formattedResults[date].organizationSubscriptionCount = item.count;
        });

        clinicianSubscriptionCounts.forEach(item => {
            const date = `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`;
            formattedResults[date].clinicianSubscriptionCount = item.count;
        });

        res.status(200).json({
            status: 'success',
            data: formattedResults,
            message: 'Subscription counts fetched successfully',
            period: {
                startDate: start.toISOString().split('T')[0],
                endDate: end.toISOString().split('T')[0]
            }
        });
    } catch (error) {
        console.error('Error fetching subscription counts:', error);
        res.status(500).json({
            status: 'error',
            error: error.message,
            message: 'An error occurred while fetching subscription counts'
        });
    }
};

const getDetailedSubscriptionCountsMonthWise = async (req, res) => {
    try {
        let { startDate, endDate } = req.query;

        // If no dates are provided, default to the current year
        if (!startDate || !endDate) {
            const currentYear = new Date().getFullYear();
            startDate = `${currentYear}-01-01`;
            endDate = `${currentYear}-12-31`;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        // Aggregate for patient subscriptions (portal-plan and doctor-plan)
        const patientSubscriptionCounts = await Subscription.aggregate([
            {
                $match: {
                    startDate: { $lte: end },
                    endDate: { $gte: start }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$startDate' },
                        month: { $month: '$startDate' }
                    },
                    active: {
                        $sum: {
                            $cond: [
                                { $and: [
                                    { $lte: ['$startDate', '$$NOW'] },
                                    { $gte: ['$endDate', '$$NOW'] }
                                ]},
                                1, 0
                            ]
                        }
                    },
                    renewal: {
                        $sum: { $cond: ['$renewal', 1, 0] }
                    },
                    ended: {
                        $sum: {
                            $cond: [
                                { $lt: ['$endDate', '$$NOW'] },
                                1, 0
                            ]
                        }
                    }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1 }
            }
        ]);

        // Aggregate for clinician subscriptions
        const clinicianSubscriptionCounts = await ClinicianSubscription.aggregate([
            {
                $match: {
                    startDate: { $lte: end },
                    endDate: { $gte: start }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$startDate' },
                        month: { $month: '$startDate' }
                    },
                    active: {
                        $sum: {
                            $cond: [
                                { $and: [
                                    { $lte: ['$startDate', '$$NOW'] },
                                    { $gte: ['$endDate', '$$NOW'] }
                                ]},
                                1, 0
                            ]
                        }
                    },
                    renewal: {
                        $sum: { $cond: ['$renewal', 1, 0] }
                    },
                    ended: {
                        $sum: {
                            $cond: [
                                { $lt: ['$endDate', '$$NOW'] },
                                1, 0
                            ]
                        }
                    }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1 }
            }
        ]);

        // Aggregate for organization subscriptions
        const organizationSubscriptionCounts = await OrganizationSubscription.aggregate([
            {
                $match: {
                    startDate: { $lte: end },
                    endDate: { $gte: start }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$startDate' },
                        month: { $month: '$startDate' }
                    },
                    active: {
                        $sum: {
                            $cond: [
                                { $and: [
                                    { $lte: ['$startDate', '$$NOW'] },
                                    { $gte: ['$endDate', '$$NOW'] }
                                ]},
                                1, 0
                            ]
                        }
                    },
                    renewal: {
                        $sum: { $cond: ['$renewal', 1, 0] }
                    },
                    ended: {
                        $sum: {
                            $cond: [
                                { $lt: ['$endDate', '$$NOW'] },
                                1, 0
                            ]
                        }
                    }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1 }
            }
        ]);

        const formattedResults = {};

        // Initialize all months with zero counts
        for (let year = start.getFullYear(); year <= end.getFullYear(); year++) {
            const startMonth = year === start.getFullYear() ? start.getMonth() + 1 : 1;
            const endMonth = year === end.getFullYear() ? end.getMonth() + 1 : 12;

            for (let month = startMonth; month <= endMonth; month++) {
                const date = `${year}-${month.toString().padStart(2, '0')}`;
                formattedResults[date] = {
                    patientSubscription: { active: 0, renewal: 0, ended: 0 },
                    clinicianSubscription: { active: 0, renewal: 0, ended: 0 },
                    organizationSubscription: { active: 0, renewal: 0, ended: 0 }
                };
            }
        }

        // Populate the results
        patientSubscriptionCounts.forEach(item => {
            const date = `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`;
            if (formattedResults[date]) {
                formattedResults[date].patientSubscription = {
                    active: item.active,
                    renewal: item.renewal,
                    ended: item.ended
                };
            }
        });

        clinicianSubscriptionCounts.forEach(item => {
            const date = `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`;
            if (formattedResults[date]) {
                formattedResults[date].clinicianSubscription = {
                    active: item.active,
                    renewal: item.renewal,
                    ended: item.ended
                };
            }
        });

        organizationSubscriptionCounts.forEach(item => {
            const date = `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`;
            if (formattedResults[date]) {
                formattedResults[date].organizationSubscription = {
                    active: item.active,
                    renewal: item.renewal,
                    ended: item.ended
                };
            }
        });

        res.status(200).json({
            status: 'success',
            data: formattedResults,
            message: 'Detailed subscription counts fetched successfully',
            period: {
                startDate: start.toISOString().split('T')[0],
                endDate: end.toISOString().split('T')[0]
            }
        });
    } catch (error) {
        console.error('Error fetching detailed subscription counts:', error);
        res.status(500).json({
            status: 'error',
            error: error.message,
            message: 'An error occurred while fetching detailed subscription counts'
        });
    }
};

module.exports = {
    registerAdmin,
    loginAdmin,
    updateAdminName, 
    updateAdminPassword,
    getAllOrganizations,
    getOrganizationStats,
    getPatients,
    getDoctors,
    verifyDoctor,
    getPortalPlans,
    getPortalPlanById,
    updatePortalPlan,
    deletePortalPlan,
    getPortalPlanSubscriptions,
    getPortalPlanSubscriptionCounts,
    getPortalPlanEarnings,
    getPortalPlanEarningsSummary,
    getPortalClinicians,
    updatePortalClinician,
    deletePortalClinician,
    getPortalClinicianCounts,
    getPortalPlanPatientAssessments,
    getAllAssessmentInfos,
    getDoctorPlanSubscriptions,
    getDoctorPlanSubscriptionsMonthWise,
    getAllSubscriptions,
    getAllSubscriptionsMonthWise,
    getPortalSubscriptionsMonthWise,
    getDoctorPlanSubscriptionsWithDetails,
    calculateTotalEarnings,
    getSubscriptionCountsMonthWise,
    getDetailedSubscriptionCountsMonthWise
};

