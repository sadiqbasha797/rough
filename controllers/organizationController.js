const Organization = require('../models/organization');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const createNotification = require('../utils/createNotification'); // Import the notification helper
const sendEmail = require('../utils/mailUtil'); // Import the mail utility
const Clinisist = require('../models/Clinisist');
const Plan = require('../models/plan');
const Subscription = require('../models/subscription');
const Patient = require('../models/patient');
const moment = require('moment');
const OrgAdmin = require('../models/orgAdmin');
const Manager = require('../models/manager');
const { uploadFile, deleteFile, getFileUrl } = require('../utils/s3Util');
const Notification = require('../models/Notification');

const registerOrganization = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // Check if the organization already exists
        const existingOrg = await Organization.findOne({ email });
        if (existingOrg) {
            return res.status(400).json({
                status: 'error',
                body: null,
                message: 'Organization already exists'
            });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new organization
        const newOrg = new Organization({
            name,
            email,
            password: hashedPassword,
        });

        await newOrg.save();

        // Create a notification for the newly registered organization
        await createNotification(
            newOrg._id,               
            'Organization',           
            'Your organization has been successfully registered.', 
            null,                     
            null,                     
            'message'                 
        );

        // Send a welcome email to the newly registered organization
        await sendEmail(
            email,
            'Welcome to Our Platform',
            `Hello ${name},\n\nYour organization has been successfully registered.\n\nThank you for joining us!\n\nBest Regards,\n Ifeelincolor`
        );

        // Respond with the new organization data
        res.status(201).json({
            status: 'success',
            body: newOrg,
            message: 'Organization registered successfully'
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: err.message
        });
    }
};



// Authenticate an Organization
const loginOrganization = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if the organization exists
        const organization = await Organization.findOne({ email });
        if (!organization) {
            return res.status(400).json({
                status: 'error',
                body: null,
                message: 'Invalid email or password'
            });
        }

        // Compare the password
        const isMatch = await bcrypt.compare(password, organization.password);
        if (!isMatch) {
            return res.status(400).json({
                status: 'error',
                body: null,
                message: 'Invalid email or password'
            });
        }

        // Create and return a JWT token
        const token = jwt.sign(
            { organization: { id: organization._id, name: organization.name } },
            process.env.JWT_SECRET,
        );
        const role = "Organization"

        res.json({
            status: 'success',
            body: { 
                organization : {
                    id : organization._id,
                    name : organization.name,
                    email : organization.email,
                    token,
                    role
                }
             },
            message: 'Organization authenticated successfully'
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: err.message
        });
    }
};






// Get Organization details
const getOrganization = async (req, res) => {
    try {
        const organization = await Organization.findById(req.organization.id).select('-password');
        if (!organization) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'No organization found'
            });
        }
        res.json({
            status: 'success',
            body: organization,
            message: 'Organization details retrieved successfully'
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: err.message
        });
    }
};

// Fetch all Clinisists for a particular organization
const getClinisistsByOrganization = async (req, res) => {
    try {
        const  organizationId  = req.organization._id;
        console.log(organizationId);
        const clinisists = await Clinisist.find({ organization: organizationId });
        if (!clinisists || clinisists.length === 0) {
            return res.status(200).json({
                status: 'success',
                body: [],
                message: 'No Clinisists found for the specified organization'
            });
        }

        res.json({
            status: 'success',
            body: clinisists,
            message: 'Clinisists retrieved successfully'
        });
    } catch (error) {
        console.error('Error fetching Clinisists:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error fetching Clinisists'
        });
    }
};

const getActiveClinisistsByOrganization = async (req, res) => {
    try {
        const  organizationId  = req.organization._id;
        const activeClinisists = await Clinisist.find({ organization: organizationId, Active: 'yes' });

        if (!activeClinisists || activeClinisists.length === 0) {
            return res.status(200).json({
                status: 'success',
                body: [],
                message: 'No active Clinisists found for the specified organization'
            });
        }

        res.json({
            status: 'success',
            body: activeClinisists,
            message: 'Active Clinisists retrieved successfully'
        });
    } catch (error) {
        console.error('Error fetching active Clinisists:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error fetching active Clinisists'
        });
    }
};

const getInactiveClinisistsByOrganization = async (req, res) => {
    try {
        const  organizationId  = req.organization._id;
        const inactiveClinisists = await Clinisist.find({ organization: organizationId, Active: 'no' });

        if (!inactiveClinisists || inactiveClinisists.length === 0) {
            return res.status(200).json({
                status: 'success',
                body: [],
                message: 'No inactive Clinisists found for the specified organization'
            });
        }

        res.json({
            status: 'success',
            body: inactiveClinisists,
            message: 'Inactive Clinisists retrieved successfully'
        });
    } catch (error) {
        console.error('Error fetching inactive Clinisists:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error fetching inactive Clinisists'
        });
    }
};

const getClinisistCountByOrganization = async (req, res) => {
    try {
        const  organizationId  = req.organization._id;
        const activeCount = await Clinisist.countDocuments({ organization: organizationId, Active: 'yes' });
        const inactiveCount = await Clinisist.countDocuments({ organization: organizationId, Active: 'no' });
        const total = activeCount + inactiveCount;
        res.json({
            status: 'success',
            body: { activeCount, inactiveCount, total },
            message: 'Clinisist counts retrieved successfully'
        });
    } catch (error) {
        console.error('Error fetching Clinisist counts:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error fetching Clinisist counts'
        });
    }
};

const getCreatedByClinisist = async (req, res) => {
    try {
        const organizationId = req.organization._id;
        const clinisists = await Clinisist.find({ createdBy: organizationId });

        if (!clinisists || clinisists.length === 0) {
            return res.status(200).json({
                status: 'success',
                body: [],
                message: 'No clinisists found for this organization'
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

const createOrganizationPlan = async (req, res) => {
    try {
        const { name, price, details, validity } = req.body;

        // Validate input
        if (!name || !price || !details || !validity) {
            return res.status(400).json({
                status: 'error',
                body: null,
                message: 'Please provide all required fields: name, price, details, and validity'
            });
        }

        // Create new plan
        const newPlan = new Plan({
            name,
            price,
            details,
            validity,
            createdBy: req.organization._id, // Set the organization as the creator
            planType: 'organization-plan' // Set the plan type to organization-plan
        });

        // Save the plan
        await newPlan.save();

        res.status(201).json({
            status: 'success',
            body: newPlan,
            message: 'Organization plan created successfully'
        });
    } catch (error) {
        console.error('Error creating organization plan:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error creating organization plan'
        });
    }
};

const getOrganizationPlans = async (req, res) => {
    try {
        const organizationId = req.organization._id;
        
        const plans = await Plan.find({ 
            createdBy: organizationId, 
            planType: 'organization-plan' 
        });

        if (!plans || plans.length === 0) {
            return res.status(200).json({
                status: 'success',
                body: [],
                message: 'No organization plans found'
            });
        }

        res.status(200).json({
            status: 'success',
            body: plans,
            message: 'Organization plans retrieved successfully'
        });
    } catch (error) {
        console.error('Error fetching organization plans:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error fetching organization plans'
        });
    }
};


const getOrganizationPlanById = async (req, res) => {
    try {
        const { planId } = req.params;
        const organizationId = req.organization._id;

        const plan = await Plan.findOne({ 
            _id: planId, 
            createdBy: organizationId, 
            planType: 'organization-plan' 
        });

        if (!plan) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'Plan not found or does not belong to this organization'
            });
        }

        res.status(200).json({
            status: 'success',
            body: plan,
            message: 'Organization plan retrieved successfully'
        });
    } catch (error) {
        console.error('Error fetching organization plan:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error fetching organization plan'
        });
    }
};


const updateOrganizationPlan = async (req, res) => {
    try {
        const { planId } = req.params;
        const { name, price, details, validity, status } = req.body;
        const organizationId = req.organization._id;

        const plan = await Plan.findOne({ 
            _id: planId, 
            createdBy: organizationId, 
            planType: 'organization-plan' 
        });

        if (!plan) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'Plan not found or does not belong to this organization'
            });
        }

        plan.name = name || plan.name;
        plan.price = price || plan.price;
        plan.details = details || plan.details;
        plan.validity = validity || plan.validity;
        plan.status = status || plan.status;
        await plan.save();

        res.status(200).json({
            status: 'success',
            body: plan,
            message: 'Organization plan updated successfully'
        });
    } catch (error) {
        console.error('Error updating organization plan:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error updating organization plan'
        });
    }
};

const deleteOrganizationPlan = async (req, res) => {
    try {
        const { planId } = req.params;
        const organizationId = req.organization._id;

        const plan = await Plan.findOneAndDelete({ 
            _id: planId, 
            createdBy: organizationId, 
            planType: 'organization-plan' 
        });

        if (!plan) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'Plan not found or does not belong to this organization'
            });
        }

        res.status(200).json({
            status: 'success',
            body: null,
            message: 'Organization plan deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting organization plan:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error deleting organization plan'
        });
    }
};


const getOrganizationPatients = async (req, res) => {
    try {
        const organizationId = req.organization._id;
        
        const subscriptions = await Subscription.find({ organization: organizationId })
            .populate('patient', '-password')
            .populate('plan', 'name price validity');
        
        if (!subscriptions || subscriptions.length === 0) {
            return res.status(200).json({
                status: 'success',
                body: [],
                message: 'No patients found for this organization'
            });
        }

        const patientsWithPlans = subscriptions.map(sub => ({
            ...sub.patient.toObject(),
            subscription: {
                startDate: sub.startDate,
                endDate: sub.endDate,
                plan: sub.plan
            }
        }));
        
        res.json({
            status: 'success',
            body: patientsWithPlans,
            message: 'Organization patients with plan details retrieved successfully'
        });
    } catch (error) {
        console.error('Error fetching organization patients:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error fetching organization patients'
        });
    }
};

const getOrganizationSubscriptionCounts = async (req, res) => {
    try {
        const organizationId = req.organization._id;
        const currentDate = new Date();
        
        const validSubscriptions = await Subscription.countDocuments({
            organization: organizationId,
            endDate: { $gt: currentDate }
        });
        
        const renewalSubscriptions = await Subscription.countDocuments({
            organization: organizationId,
            renewal: true
        });
        
        const endedSubscriptions = await Subscription.countDocuments({
            organization: organizationId,
            endDate: { $lte: currentDate }
        });
        
        res.json({
            status: 'success',
            body: {
                validSubscriptions,
                renewalSubscriptions,
                endedSubscriptions
            },
            message: 'Organization subscription counts retrieved successfully'
        });
    } catch (error) {
        console.error('Error fetching organization subscription counts:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error fetching organization subscription counts'
        });
    }
};

const getOrganizationSubscriptions = async (req, res) => {
    try {
        const organizationId = req.organization._id;
        
        const subscriptions = await Subscription.find({ organization: organizationId })
            .populate('patient')
            .populate('plan')
            .populate('clinisist')
            .populate('organization');
        
        if (!subscriptions || subscriptions.length === 0) {
            return res.status(200).json({
                status: 'success',
                body: [],
                message: 'No subscriptions found for this organization'
            });
        }

        res.json({
            status: 'success',
            body: subscriptions,
            message: 'Organization subscriptions retrieved successfully'
        });
    } catch (error) {
        console.error('Error fetching organization subscriptions:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error fetching organization subscriptions'
        });
    }
};

const getMonthlySubscriptionStats = async (req, res) => {
    try {
        const organizationId = req.organization._id;
        const { startDate, endDate } = req.query;

        // Validate date range
        if (!startDate || !endDate) {
            return res.status(400).json({
                status: 'error',
                body: null,
                message: 'Please provide both startDate and endDate'
            });
        }

        const start = moment(startDate).startOf('month');
        const end = moment(endDate).endOf('month');

        if (!start.isValid() || !end.isValid() || end.isBefore(start)) {
            return res.status(400).json({
                status: 'error',
                body: null,
                message: 'Invalid date range'
            });
        }

        const subscriptions = await Subscription.find({
            organization: organizationId,
            startDate: { $lte: end.toDate() },
            endDate: { $gte: start.toDate() }
        });

        const monthlyStats = {};

        while (start.isSameOrBefore(end, 'month')) {
            const monthKey = start.format('YYYY-MM');
            monthlyStats[monthKey] = {
                valid: 0,
                renewal: 0,
                ended: 0
            };
            start.add(1, 'month');
        }

        subscriptions.forEach(sub => {
            const subStartMonth = moment(sub.startDate).format('YYYY-MM');
            const subEndMonth = moment(sub.endDate).format('YYYY-MM');
            const currentMonth = moment().format('YYYY-MM');

            if (monthlyStats[subStartMonth]) {
                if (sub.renewal) {
                    monthlyStats[subStartMonth].renewal++;
                } else if (subEndMonth >= currentMonth) {
                    monthlyStats[subStartMonth].valid++;
                } else {
                    monthlyStats[subStartMonth].ended++;
                }
            }
        });

        res.json({
            status: 'success',
            body: monthlyStats,
            message: 'Monthly subscription statistics retrieved successfully'
        });
    } catch (error) {
        console.error('Error fetching monthly subscription stats:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error fetching monthly subscription statistics'
        });
    }
};

const getOrganizationEarnings = async (req, res) => {
    try {
        const organizationId = req.organization._id;
        let { startDate, endDate } = req.query;

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
            organization: organizationId
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

        res.json({
            status: 'success',
            body: response,
            message: 'Organization earnings retrieved successfully'
        });
    } catch (error) {
        console.error('Error fetching organization earnings:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error fetching organization earnings'
        });
    }
};

const getOrganizationPatientDetails = async (req, res) => {
    try {
        const organizationId = req.organization._id;
        const { patientId } = req.params;

        // Find the patient
        const patient = await Patient.findById(patientId).lean();

        if (!patient) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'Patient not found'
            });
        }

        // Find the subscription for this patient and organization
        const subscription = await Subscription.findOne({
            patient: patientId,
            organization: organizationId
        }).populate('plan').lean();

        if (!subscription) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'Subscription not found for this patient and organization'
            });
        }

        // Combine patient and subscription data
        const result = {
            ...patient,
            planName: subscription.plan.name,
            planAmount: subscription.plan.price,
            subscriptionCreatedDate: moment(subscription.createdAt).format('DD/MM/YYYY'),
            subscriptionStartDate: moment(subscription.startDate).format('DD/MM/YYYY'),
            subscriptionEndDate: moment(subscription.endDate).format('DD/MM/YYYY')
        };

        res.json({
            status: 'success',
            body: result,
            message: 'Patient details retrieved successfully'
        });
    } catch (error) {
        console.error('Error fetching patient details:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error fetching patient details'
        });
    }
};


// ... existing imports and functions ...

const updateOrgAdmin = async (req, res) => {
    try {
        const { orgAdminId } = req.params;
        const updateData = req.body;

        // Ensure the organization can only update its own OrgAdmins
        const orgAdmin = await OrgAdmin.findOne({ _id: orgAdminId, organization: req.organization._id });

        if (!orgAdmin) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'OrgAdmin not found or does not belong to this organization'
            });
        }

        // Update the OrgAdmin
        const updatedOrgAdmin = await OrgAdmin.findByIdAndUpdate(orgAdminId, updateData, { new: true });

        res.json({
            status: 'success',
            body: updatedOrgAdmin,
            message: 'OrgAdmin updated successfully'
        });
    } catch (error) {
        console.error('Error updating OrgAdmin:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error updating OrgAdmin'
        });
    }
};

const updateManager = async (req, res) => {
    try {
        const { managerId } = req.params;
        const updateData = req.body;

        // Ensure the organization can only update its own Managers
        const manager = await Manager.findOne({ _id: managerId, organization: req.organization._id });

        if (!manager) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'Manager not found or does not belong to this organization'
            });
        }

        // Update the Manager
        const updatedManager = await Manager.findByIdAndUpdate(managerId, updateData, { new: true });

        res.json({
            status: 'success',
            body: updatedManager,
            message: 'Manager updated successfully'
        });
    } catch (error) {
        console.error('Error updating Manager:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error updating Manager'
        });
    }
};

const deleteOrgAdmin = async (req, res) => {
    try {
        const { orgAdminId } = req.params;

        // Ensure the organization can only delete its own OrgAdmins
        const orgAdmin = await OrgAdmin.findOne({ _id: orgAdminId, organization: req.organization._id });

        if (!orgAdmin) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'OrgAdmin not found or does not belong to this organization'
            });
        }

        // Delete the OrgAdmin
        await OrgAdmin.findByIdAndDelete(orgAdminId);

        // Update Clinisists created by this OrgAdmin
        await Clinisist.updateMany(
            { createdBy: orgAdminId },
            { $set: { createdBy: null } }
        );

        res.json({
            status: 'success',
            body: null,
            message: 'OrgAdmin deleted successfully and associated Clinisists updated'
        });
    } catch (error) {
        console.error('Error deleting OrgAdmin:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error deleting OrgAdmin'
        });
    }
};

const deleteManager = async (req, res) => {
    try {
        const { managerId } = req.params;

        // Ensure the organization can only delete its own Managers
        const manager = await Manager.findOne({ _id: managerId, organization: req.organization._id });

        if (!manager) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'Manager not found or does not belong to this organization'
            });
        }

        // Delete the Manager
        await Manager.findByIdAndDelete(managerId);

        // Update Clinisists created by this Manager
        await Clinisist.updateMany(
            { createdBy: managerId },
            { $set: { createdBy: null } }
        );

        res.json({
            status: 'success',
            body: null,
            message: 'Manager deleted successfully and associated Clinisists updated'
        });
    } catch (error) {
        console.error('Error deleting Manager:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error deleting Manager'
        });
    }
};

const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({
            'recipient.id': req.organization._id,
            'recipient.model': 'Organization'
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

const updateOrganizationImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                status: 'error',
                body: null,
                message: 'No image file provided'
            });
        }

        const organizationId = req.organization._id;
        const organization = await Organization.findById(organizationId);

        if (!organization) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'Organization not found'
            });
        }

        // Delete old image if it exists
        if (organization.image) {
            const oldImageKey = organization.image.split('/').pop();
            await deleteFile(oldImageKey);
        }

        // Upload new image
        const fileContent = req.file.buffer;
        const fileName = `org_${organizationId}_${Date.now()}_${req.file.originalname}`;
        const mimeType = req.file.mimetype;

        const imageUrl = await uploadFile(fileContent, fileName, mimeType);

        // Update organization with new image URL
        organization.image = imageUrl;
        await organization.save();

        res.json({
            status: 'success',
            body: { imageUrl },
            message: 'Organization image updated successfully'
        });
    } catch (error) {
        console.error('Error updating organization image:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error updating organization image'
        });
    }
};

const updateOrganizationData = async (req, res) => {
    try {
        const organizationId = req.organization._id;
        const updateData = req.body;

        // Fields that are allowed to be updated
        const allowedUpdates = ['name', 'founder', 'companyName', 'established', 'address', 'mobile', 'socialProfile', 'active'];

        // Filter out any fields that are not in the allowedUpdates array
        const filteredData = Object.keys(updateData)
            .filter(key => allowedUpdates.includes(key))
            .reduce((obj, key) => {
                obj[key] = updateData[key];
                return obj;
            }, {});

        const organization = await Organization.findByIdAndUpdate(
            organizationId,
            filteredData,
            { new: true, runValidators: true }
        );

        if (!organization) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'Organization not found'
            });
        }

        res.json({
            status: 'success',
            body: organization,
            message: 'Organization data updated successfully'
        });
    } catch (error) {
        console.error('Error updating organization data:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error updating organization data'
        });
    }
};


const updateOrganizationCertificate = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                status: 'error',
                body: null,
                message: 'No certificate file provided'
            });
        }

        const organizationId = req.organization._id;
        const organization = await Organization.findById(organizationId);

        if (!organization) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'Organization not found'
            });
        }

        // Delete old certificate if it exists
        if (organization.certificate) {
            const oldCertificateKey = organization.certificate.split('/').pop();
            await deleteFile(oldCertificateKey);
        }

        // Upload new certificate
        const fileContent = req.file.buffer;
        const fileName = `org_certificate_${organizationId}_${Date.now()}_${req.file.originalname}`;
        const mimeType = req.file.mimetype;

        const certificateUrl = await uploadFile(fileContent, fileName, mimeType);

        // Update organization with new certificate URL
        organization.certificate = certificateUrl;
        await organization.save();

        res.json({
            status: 'success',
            body: { certificateUrl },
            message: 'Organization certificate updated successfully'
        });
    } catch (error) {
        console.error('Error updating organization certificate:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error updating organization certificate'
        });
    }
};


module.exports = {
    getClinisistsByOrganization,
    registerOrganization,
    loginOrganization,
    getOrganization,
    getActiveClinisistsByOrganization,
    getInactiveClinisistsByOrganization, 
    getClinisistCountByOrganization,
    getCreatedByClinisist,
    createOrganizationPlan,
    getOrganizationPlans,
    getOrganizationPlanById,
    updateOrganizationPlan,
    deleteOrganizationPlan, 
    getOrganizationPatients,
    getOrganizationSubscriptionCounts,
    getOrganizationSubscriptions,
    getMonthlySubscriptionStats,
    getOrganizationEarnings,
    getOrganizationPatientDetails,
    updateOrgAdmin,
    updateManager,
    deleteOrgAdmin,
    deleteManager,
    getNotifications,
    updateOrganizationImage,
    updateOrganizationData,
    updateOrganizationCertificate
};