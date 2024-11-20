const Manager = require('../models/manager');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/mailUtil'); 
const createNotification  = require('../utils/createNotification');
const Organization = require('../models/organization');
const Clinisist = require('../models/Clinisist');
const Subscription = require('../models/subscription');
const Notification = require('../models/Notification');
const Patient = require('../models/patient');
const moment = require('moment');
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
            return res.status(200).json({
                status: 'success',
                body: [],
                message: 'No records found'
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
            return res.status(200).json({
                status: 'success',
                body: [],
                message: 'No records found'
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
            return res.status(200).json({
                status: 'success',
                body: [],
                message: 'No records found'
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
            return res.status(200).json({
                status: 'success',
                body: null,
                message: 'No records found'
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
            return res.status(200).json({
                status: 'success',
                body: [],
                message: 'No records found'
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
        const activeCount = await Clinisist.countDocuments({ createdBy: managerId, Active: "yes" });

        // Get inactive count
        const inactiveCount = await Clinisist.countDocuments({ createdBy: managerId, Active: "no" });

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
            return res.status(200).json({
                status: 'success',
                body: [],
                message: 'No records found'
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
            return res.status(200).json({
                status: 'success',
                body: [],
                message: 'No records found'
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
            return res.status(200).json({
                status: 'success',
                body: {
                    validSubscriptions: 0,
                    renewalSubscriptions: 0,
                    endedSubscriptions: 0
                },
                message: 'No records found'
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
                validSubscriptions: activeCount,
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
        let { startDate, endDate } = req.query;

        // Find clinisists created by this manager
        const clinisists = await Clinisist.find({ createdBy: managerId });

        if (!clinisists || clinisists.length === 0) {
            return res.status(200).json({
                status: 'success',
                body: {
                    monthlyEarnings: {},
                    totalEarningsThisYear: 0,
                    allTimeEarnings: 0
                },
                message: 'No records found'
            });
        }

        const clinisistIds = clinisists.map(clinisist => clinisist._id);

        const currentDate = moment();
        const currentYear = currentDate.year();

        let start, end;
        let isCurrentYearQuery = false;

        if (!startDate || !endDate) {
            start = moment().startOf('year');
            end = moment().endOf('year');
            isCurrentYearQuery = true;
        } else {
            start = moment(startDate).startOf('day');
            end = moment(endDate).endOf('day');
        }

        if (!start.isValid() || !end.isValid() || end.isBefore(start)) {
            return res.status(400).json({
                status: 'error',
                body: null,
                message: 'Invalid date range'
            });
        }

        const allSubscriptions = await Subscription.find({
            clinisist: { $in: clinisistIds }
        }).populate('plan', 'price');

        const monthlyEarnings = {};
        let periodTotal = 0;
        let allTimeTotal = 0;

        allSubscriptions.forEach(sub => {
            const subStartDate = moment(sub.startDate);
            const earnings = sub.plan.price;

            // Calculate all-time total
            allTimeTotal += earnings;

            // Calculate period total and monthly earnings
            if (subStartDate.isBetween(start, end, null, '[]')) {
                periodTotal += earnings;

                const monthKey = subStartDate.format('YYYY-MM');
                if (!monthlyEarnings[monthKey]) {
                    monthlyEarnings[monthKey] = 0;
                }
                monthlyEarnings[monthKey] += earnings;
            }
        });

        // Fill in months with zero earnings for the queried period
        let currentMonth = start.clone().startOf('month');
        while (currentMonth.isSameOrBefore(end, 'month')) {
            const monthKey = currentMonth.format('YYYY-MM');
            if (!monthlyEarnings[monthKey]) {
                monthlyEarnings[monthKey] = 0;
            }
            currentMonth.add(1, 'month');
        }

        // Sort monthly earnings
        const sortedMonthlyEarnings = Object.fromEntries(
            Object.entries(monthlyEarnings).sort(([a], [b]) => a.localeCompare(b))
        );

        const response = {
            monthlyEarnings: sortedMonthlyEarnings,
            periodTotal,
            allTimeTotal
        };

        if (isCurrentYearQuery) {
            response.currentYearTotal = periodTotal;
        }

        res.status(200).json({
            status: 'success',
            body: response,
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
            return res.status(200).json({
                status: 'success',
                body: {
                    currentMonthEarnings: 0,
                    currentYearEarnings: 0,
                    totalEarnings: 0
                },
                message: 'No records found'
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

const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({
            'recipient.id': req.manager._id,
            'recipient.model': 'Manager'
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


const getSubscribedPatientsOfClinicians = async (req, res) => {
    try {
        const managerId = req.manager._id;

        // Find clinicians created by this manager
        const clinicians = await Clinisist.find({ createdBy: managerId });

        // Get subscriptions for these clinicians
        const subscriptions = await Subscription.find({
            clinisist: { $in: clinicians.map(c => c._id) }
        }).populate('patient');

        // Extract unique patients from subscriptions
        const patients = [...new Map(subscriptions.map(s => [s.patient._id, s.patient])).values()];

        res.json({
            success: true,
            body: patients,
            message: "Subscribed patients retrieved successfully"
        });
    } catch (error) {
        console.error('Error fetching subscribed patients:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getManagerAndOrganizationInfo = async (req, res) => {
    try {
        const managerId = req.manager._id;

        // Fetch manager information
        const manager = await Manager.findById(managerId).select('-password');

        if (!manager) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'Manager not found'
            });
        }

        // Fetch organization information
        const organization = await Organization.findById(manager.organization);

        if (!organization) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'Organization not found'
            });
        }

        res.status(200).json({
            status: 'success',
            body: {
                manager: manager.toObject(),
                organization: organization.toObject()
            },
            message: 'Manager and organization information retrieved successfully'
        });
    } catch (error) {
        console.error('Error fetching manager and organization info:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error fetching manager and organization information: ' + error.message
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
    getManagerEarnings,
    getNotifications,
    getSubscribedPatientsOfClinicians,
    getManagerAndOrganizationInfo
};
