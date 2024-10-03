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
            `Hello ${name},\n\nYour organization has been successfully registered.\n\nThank you for joining us!\n\nBest Regards,\nYour Company Name`
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



const updateOrganization = async (req, res) => {
    try {
        const organizationId = req.organization.id;
        const updateData = req.body;
        const imageFile = req.file; // Assuming you're using multer for file upload

        // Remove sensitive fields that shouldn't be updated directly
        delete updateData.password;
        delete updateData.email;
        delete updateData.verified;
        delete updateData.active;

        // Find the current organization data
        const currentOrg = await Organization.findById(organizationId);

        if (!currentOrg) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'Organization not found'
            });
        }

        // Handle image upload if a new image is provided
        if (imageFile) {
            const fileContent = imageFile.buffer;
            const fileName = `org_${organizationId}_${Date.now()}_${imageFile.originalname}`;
            const mimeType = imageFile.mimetype;

            try {
                // Upload new image
                const imageUrl = await uploadFile(fileContent, fileName, mimeType);
                updateData.image = imageUrl;

                // Delete old image if it exists
                if (currentOrg.image) {
                    const oldImageKey = currentOrg.image.split('/').pop();
                    await deleteFile(oldImageKey);
                }
            } catch (uploadError) {
                console.error('Error uploading image:', uploadError);
                return res.status(500).json({
                    status: 'error',
                    body: null,
                    message: 'Error uploading image'
                });
            }
        }

        // Update the organization
        const updatedOrganization = await Organization.findByIdAndUpdate(
            organizationId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password');

        res.json({
            status: 'success',
            body: updatedOrganization,
            message: 'Organization updated successfully'
        });
    } catch (error) {
        console.error('Error updating Organization:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error updating Organization'
        });
    }
};

// Get Organization details
const getOrganization = async (req, res) => {
    try {
        const organization = await Organization.findById(req.organization.id).select('-password');
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
        if (!clinisists.length) {
            return res.status(404).json({
                status: 'error',
                body: null,
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

        if (!activeClinisists.length) {
            return res.status(404).json({
                status: 'error',
                body: null,
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

        if (!inactiveClinisists.length) {
            return res.status(404).json({
                status: 'error',
                body: null,
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
            return res.status(404).json({
                status: 'error',
                body: null,
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
        const { name, price, details, validity } = req.body;
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



module.exports = {
    getClinisistsByOrganization,
    registerOrganization,
    loginOrganization,
    updateOrganization,
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
};
