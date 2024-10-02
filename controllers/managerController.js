const Manager = require('../models/manager');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/mailUtil'); 
const createNotification  = require('../utils/createNotification');
const Organization = require('../models/organization');
const Clinisist = require('../models/Clinisist');
const Subscription = require('../models/subscription');

const registerManager = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const organizationId = req.organization._id;
        
        // Check if the organization is active
        const organization = await Organization.findById(organizationId);
        if (!organization || !organization.active) {
            return res.status(403).json({
                status: 'error',
                body: null,
                message: 'Organization is not active. Cannot register manager.'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const manager = new Manager({
            name,
            email,
            password: hashedPassword,
            organization: organizationId, 
        });

        await manager.save();
        const token = jwt.sign({ id: manager._id, organization: manager.organization, role:"manager" }, process.env.JWT_SECRET, { expiresIn: '1h' });

        await createNotification(
            organizationId,               
            'Organization',               
            `A new manager, ${name}, has been registered.`, 
            manager._id,                 
            'Manager',               
            'message'                   
        );

        await createNotification(
            manager._id,                  
            'Manager',                   
            'Your manager account has been successfully created.',
            null,                        
            null,                      
            'message'                    
        );

        await sendEmail(
            email,
            'Welcome to the Organization',
            `Hello ${name},\n\nYour manager account has been successfully created.\n\nBest Regards,\nYour Company Name`
        );

        res.status(201).json({
            status: 'success',
            body: { token, manager },
            message: 'Manager registered successfully'
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: err.message
        });
    }
};

// Login an existing Manager
const loginManager = async (req, res) => {
    const { email, password } = req.body;

    try {
        const manager = await Manager.findOne({ email });

        if (!manager || !(await bcrypt.compare(password, manager.password))) {
            return res.status(401).json({
                status: 'error',
                body: null,
                message: 'Invalid credentials'
            });
        }

        // Generate token
        const token = jwt.sign(
            {
                id: manager._id,
                role: "manager",
                organization: manager.organization,
                userType: 'manager'
            },
            process.env.JWT_SECRET,
        );

        console.log('Generated token:', token);

        res.json({
            status: 'success',
            body: { 
                token,
                manager: {
                    id: manager._id,
                    name: manager.name,
                    email: manager.email,
                    role: "manager",
                    organization: manager.organization
                }
            },
            message: 'Manager logged in successfully'
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({
            status: 'error',
            body: null,
            message: err.message
        });
    }
};

// Get Manager details
const getManagerDetails = (req, res) => {
    res.json({
        status: 'success',
        body: req.manager,
        message: 'Manager details retrieved successfully'
    });
};

// Update Manager details
const updateManager = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // Check if the organization is active
        const organization = await Organization.findById(req.manager.organization);
        if (!organization || !organization.active) {
            return res.status(403).json({
                status: 'error',
                body: null,
                message: 'Organization is not active. Cannot update manager details.'
            });
        }

        if (password) {
            req.manager.password = await bcrypt.hash(password, 10);
        }

        req.manager.name = name || req.manager.name;
        req.manager.email = email || req.manager.email;

        await req.manager.save();

        res.json({
            status: 'success',
            body: req.manager,
            message: 'Manager details updated successfully'
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: err.message
        });
    }
};

// Delete Manager
const deleteManager = async (req, res) => {
    try {
        await Manager.findByIdAndDelete(req.manager._id);

        res.json({
            status: 'success',
            body: null,
            message: 'Manager deleted successfully'
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: err.message
        });
    }
};

// Fetch All Managers of a Particular Organization
const getAllManagersByOrganization = async (req, res) => {
    try {
        const organizationId  = req.organization._id; 
        const managers = await Manager.find({ organization: organizationId });

        if (!managers || managers.length === 0) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'No managers found for this organization'
            });
        }

        res.status(200).json({
            status: 'success',
            body: managers,
            message: 'Managers retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error fetching managers: ' + error.message
        });
    }
};

// Fetch Active Managers of a Particular Organization
const getActiveManagersByOrganization = async (req, res) => {
    try {
        const organizationId  = req.organization._id; 
        const activeManagers = await Manager.find({ organization: organizationId, Active: 'yes' });

        if (!activeManagers || activeManagers.length === 0) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'No active managers found for this organization'
            });
        }

        res.status(200).json({
            status: 'success',
            body: activeManagers,
            message: 'Active managers retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error fetching active managers: ' + error.message
        });
    }
};

// Fetch Inactive Managers of a Particular Organization
const getInactiveManagersByOrganization = async (req, res) => {
    try {
        const organizationId  = req.organization._id; 
        const inactiveManagers = await Manager.find({ organization: organizationId, Active: 'no' });

        if (!inactiveManagers || inactiveManagers.length === 0) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'No inactive managers found for this organization'
            });
        }

        res.status(200).json({
            status: 'success',
            body: inactiveManagers,
            message: 'Inactive managers retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error fetching inactive managers: ' + error.message
        });
    }
};

// Fetch Counts of Active, Inactive, and Total Managers of a Particular Organization
const getManagersCountByOrganization = async (req, res) => {
    try {
        const organizationId  = req.organization._id; 
        const totalManagers = await Manager.countDocuments({ organization: organizationId });
        const activeManagersCount = await Manager.countDocuments({ organization: organizationId, Active: 'yes' });
        const inactiveManagersCount = await Manager.countDocuments({ organization: organizationId, Active: 'no' });

        res.status(200).json({
            status: 'success',
            body: {
                total: totalManagers,
                active: activeManagersCount,
                inactive: inactiveManagersCount
            },
            message: 'Manager counts retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error fetching manager counts: ' + error.message
        });
    }
};

// Fetch Manager by ID
const getManagerById = async (req, res) => {
    try {
        const managerId = req.params.id;
        const manager = await Manager.findById(managerId);

        if (!manager) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'Manager not found'
            });
        }

        res.status(200).json({
            status: 'success',
            body: manager,
            message: 'Manager retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error fetching manager: ' + error.message
        });
    }
};

// Fetch Clinisists created by this Manager
const getClinisistsCreatedByManager = async (req, res) => {
    try {
        const managerId = req.manager._id;
        const clinisists = await Clinisist.find({ createdBy: managerId });

        if (!clinisists || clinisists.length === 0) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'No clinisists found created by this manager'
            });
        }

        res.status(200).json({
            status: 'success',
            body: clinisists,
            message: 'Clinisists retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error fetching clinisists: ' + error.message
        });
    }
};
// Fetch counts of clinisists joined by the manager
const getClinisistCountsByManager = async (req, res) => {
    try {
        const managerId = req.manager._id;

        // Get total count
        const totalCount = await Clinisist.countDocuments({ createdBy: managerId });

        // Get active count
        const activeCount = await Clinisist.countDocuments({ createdBy: managerId, active: "yes" });

        // Get inactive count
        const inactiveCount = await Clinisist.countDocuments({ createdBy: managerId, active: "yes" });

        res.status(200).json({
            status: 'success',
            body: {
                totalClinisists: totalCount,
                activeClinisists: activeCount,
                inactiveClinisists: inactiveCount
            },
            message: 'Clinisist counts retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error fetching clinisist counts: ' + error.message
        });
    }
};


// Fetch subscriptions of clinisists joined by the manager
const getSubscriptionsOfClinisistsJoinedByManager = async (req, res) => {
    try {
        const managerId = req.manager._id;

        // Find all clinisists created by this manager
        const clinisists = await Clinisist.find({ createdBy: managerId });

        if (!clinisists || clinisists.length === 0) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'No clinisists found created by this manager'
            });
        }

        // Get the IDs of these clinisists
        const clinisistIds = clinisists.map(clinisist => clinisist._id);

        // Find all subscriptions where the clinisist is in the list of clinisists created by the manager
        const subscriptions = await Subscription.find({ clinisist: { $in: clinisistIds } })
            .populate('patient') // Populate patient details
            .populate('plan') // Populate plan details
            .populate('clinisist'); // Populate clinisist details

        if (!subscriptions || subscriptions.length === 0) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'No subscriptions found for clinisists joined by this manager'
            });
        }

        res.status(200).json({
            status: 'success',
            body: subscriptions,
            message: 'Subscriptions retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error fetching subscriptions: ' + error.message
        });
    }
};

// Get counts of active, renewal, and ended subscriptions for clinisists joined by the manager
const getSubscriptionCountsByManager = async (req, res) => {
    try {
        const managerId = req.manager._id;

        // Find all clinisists created by this manager
        const clinisists = await Clinisist.find({ createdBy: managerId });

        if (!clinisists || clinisists.length === 0) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'No clinisists found created by this manager'
            });
        }

        // Get the IDs of these clinisists
        const clinisistIds = clinisists.map(clinisist => clinisist._id);

        const currentDate = new Date();

        // Count active subscriptions
        const activeCount = await Subscription.countDocuments({
            clinisist: { $in: clinisistIds },
            startDate: { $lte: currentDate },
            endDate: { $gt: currentDate }
        });

        // Count renewal subscriptions
        const renewalCount = await Subscription.countDocuments({
            clinisist: { $in: clinisistIds },
            renewal: true
        });

        // Count ended subscriptions
        const endedCount = await Subscription.countDocuments({
            clinisist: { $in: clinisistIds },
            endDate: { $lte: currentDate }
        });

        res.status(200).json({
            status: 'success',
            body: {
                activeSubscriptions: activeCount,
                renewalSubscriptions: renewalCount,
                endedSubscriptions: endedCount
            },
            message: 'Subscription counts retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error fetching subscription counts: ' + error.message
        });
    }
};

const getSubscriptionBudgetByManager = async (req, res) => {
    try {
        const managerId = req.manager._id;
        const { startDate, endDate } = req.query;

        // Find clinisists created by this manager
        const clinisists = await Clinisist.find({ createdBy: managerId });

        if (!clinisists || clinisists.length === 0) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'No clinisists found created by this manager'
            });
        }

        // Get the IDs of these clinisists
        const clinisistIds = clinisists.map(clinisist => clinisist._id);

        let matchCondition = {
            clinisist: { $in: clinisistIds }
        };

        let currentYear = new Date().getFullYear();
        let yearStart = new Date(currentYear, 0, 1);
        let yearEnd = new Date(currentYear, 11, 31);

        if (startDate && endDate) {
            matchCondition.startDate = { $gte: new Date(startDate) };
            matchCondition.endDate = { $lte: new Date(endDate) };
        } else {
            matchCondition.startDate = { $gte: yearStart };
            matchCondition.endDate = { $lte: yearEnd };
        }

        const subscriptions = await Subscription.aggregate([
            { $match: matchCondition },
            {
                $lookup: {
                    from: 'plans',
                    localField: 'plan',
                    foreignField: '_id',
                    as: 'planDetails'
                }
            },
            { $unwind: '$planDetails' },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$startDate" } },
                    monthlyEarnings: { $sum: '$planDetails.price' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const monthlyEarnings = {};
        for (let i = 0; i < 12; i++) {
            const month = `${currentYear}-${String(i + 1).padStart(2, '0')}`;
            monthlyEarnings[month] = 0;
        }

        subscriptions.forEach(sub => {
            monthlyEarnings[sub._id] = sub.monthlyEarnings;
        });

        const totalEarnings = Object.values(monthlyEarnings).reduce((a, b) => a + b, 0);

        // Calculate all-time earnings
        const allTimeEarnings = await Subscription.aggregate([
            { $match: { clinisist: { $in: clinisistIds } } },
            {
                $lookup: {
                    from: 'plans',
                    localField: 'plan',
                    foreignField: '_id',
                    as: 'planDetails'
                }
            },
            { $unwind: '$planDetails' },
            {
                $group: {
                    _id: null,
                    totalEarnings: { $sum: '$planDetails.price' }
                }
            }
        ]);

        res.status(200).json({
            status: 'success',
            body: {
                monthlyEarnings,
                totalEarningsThisYear: totalEarnings,
                allTimeEarnings: allTimeEarnings[0] ? allTimeEarnings[0].totalEarnings : 0
            },
            message: 'Subscription budget retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error fetching subscription budget: ' + error.message
        });
    }
};

// Calculate earnings for clinisists joined by the manager
const getManagerEarnings = async (req, res) => {
    try {
        const managerId = req.manager._id;

        // Find all clinisists created by this manager
        const clinisists = await Clinisist.find({ createdBy: managerId });

        if (!clinisists || clinisists.length === 0) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'No clinisists found created by this manager'
            });
        }

        // Get the IDs of these clinisists
        const clinisistIds = clinisists.map(clinisist => clinisist._id);

        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;

        // Calculate earnings for current month, current year, and all time
        const earnings = await Subscription.aggregate([
            { $match: { clinisist: { $in: clinisistIds } } },
            {
                $lookup: {
                    from: 'plans',
                    localField: 'plan',
                    foreignField: '_id',
                    as: 'planDetails'
                }
            },
            { $unwind: '$planDetails' },
            {
                $project: {
                    year: { $year: '$startDate' },
                    month: { $month: '$startDate' },
                    earnings: '$planDetails.price'
                }
            },
            {
                $group: {
                    _id: null,
                    currentMonthEarnings: {
                        $sum: {
                            $cond: [
                                { $and: [
                                    { $eq: ['$year', currentYear] },
                                    { $eq: ['$month', currentMonth] }
                                ]},
                                '$earnings',
                                0
                            ]
                        }
                    },
                    currentYearEarnings: {
                        $sum: {
                            $cond: [
                                { $eq: ['$year', currentYear] },
                                '$earnings',
                                0
                            ]
                        }
                    },
                    totalEarnings: { $sum: '$earnings' }
                }
            }
        ]);

        const result = earnings.length > 0 ? earnings[0] : {
            currentMonthEarnings: 0,
            currentYearEarnings: 0,
            totalEarnings: 0
        };

        res.status(200).json({
            status: 'success',
            body: {
                currentMonthEarnings: result.currentMonthEarnings,
                currentYearEarnings: result.currentYearEarnings,
                totalEarnings: result.totalEarnings
            },
            message: 'Earnings calculated successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error calculating earnings: ' + error.message
        });
    }
};


module.exports = {
    registerManager,
    loginManager,
    getManagerDetails,
    updateManager,
    deleteManager,
    getAllManagersByOrganization, 
    getActiveManagersByOrganization, 
    getInactiveManagersByOrganization, 
    getManagersCountByOrganization,
    getManagerById,
    getClinisistsCreatedByManager,
    getClinisistCountsByManager,
    getSubscriptionsOfClinisistsJoinedByManager,
    getSubscriptionCountsByManager,
    getSubscriptionBudgetByManager,
    getManagerEarnings
};
