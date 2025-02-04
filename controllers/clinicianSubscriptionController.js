const ClinicianSubscription = require('../models/clinisistSubscription');
const Clinisist = require('../models/Clinisist');
const ClinicistPlan = require('../models/clinisistPlan');
const createNotification = require('../utils/createNotification');
const sendEmail = require('../utils/mailUtil');
const moment = require('moment');

// Create a new clinician subscription or renew existing one
const createClinicianSubscription = async (req, res) => {
    try {
        const clinicianId = req.clinisist.id;
        const planId = req.params.id;
        const clinician = await Clinisist.findById(clinicianId);
        if (!clinician) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'Clinician not found'
            });
        }

        const plan = await ClinicistPlan.findById(planId);
        if (!plan) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'Clinicist plan not found'
            });
        }

        const startDate = new Date();
        const endDate = new Date(startDate.getTime() + plan.validity * 24 * 60 * 60 * 1000);

        let subscription = await ClinicianSubscription.findOne({ clinician: clinicianId });
        let isRenewal = false;

        if (subscription) {
            subscription.price = plan.price;
            subscription.startDate = startDate;
            subscription.endDate = endDate;
            subscription.validity = plan.validity;
            subscription.renewal = true;
            subscription.plan = plan._id;
            isRenewal = true;
        } else {
            subscription = new ClinicianSubscription({
                clinician: clinicianId,
                price: plan.price,
                startDate,
                endDate,
                validity: plan.validity,
                renewal: false,
                plan: plan._id
            });
        }

        await subscription.save();
        await Clinisist.findByIdAndUpdate(clinicianId, { Active: 'yes' });

        const notificationMessage = isRenewal
            ? `Subscription renewed for plan: ${plan.planName}.`
            : `New subscription created for plan: ${plan.planName}.`;
        await createNotification(
            clinicianId,
            'Clinisist',
            notificationMessage,
            null,
            null,
            'subscription'
        );

        // Create notification for admin
        const adminNotificationMessage = isRenewal
            ? `Clinician ${clinician.name} renewed subscription for plan: ${plan.planName}.`
            : `Clinician ${clinician.name} created new subscription for plan: ${plan.planName}.`;
        await createNotification(
            null,
            'Admin',
            adminNotificationMessage,
            null,
            null,
            'subscription'
        );

        const emailSubject = isRenewal ? 'Subscription Renewal Confirmation' : 'New Subscription Confirmation';
        const emailBody = `Dear ${clinician.name},\n\n${isRenewal ? 'Your subscription has been renewed' : 'Your new subscription has been created'} successfully.\n\nDetails:\nPlan: ${plan.planName}\nStart Date: ${startDate}\nEnd Date: ${endDate}\nValidity: ${plan.validity} days\nTotal Price: $${plan.price}\n\nYour account is now active.\n\nThank you for your subscription!\n\nBest regards,\nYour Company Name`;

        await sendEmail(clinician.email, emailSubject, emailBody);

        res.status(201).json({
            status: 'success',
            body: subscription,
            message: `Clinician subscription ${isRenewal ? 'renewed' : 'created'} successfully, clinician activated, and confirmation email sent`
        }); 
    } catch (error) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: error.message
        });
    }
};

// Get all clinician subscriptions
const getAllClinicianSubscriptions = async (req, res) => {
    try {
        const subscriptions = await ClinicianSubscription.find().populate('clinician');
        if (subscriptions.length === 0) {
            return res.status(200).json({
                status: 'success',
                body: [],
                message: 'No clinician subscriptions found'
            });
        }
        res.status(200).json({
            status: 'success',
            body: subscriptions,
            message: 'Clinician subscriptions retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: error.message
        });
    }
};

// Get a specific clinician subscription
const getClinicianSubscription = async (req, res) => {
    try {
        const subscription = await ClinicianSubscription.findById(req.params.id).populate('clinician');
        if (!subscription) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'Subscription not found'
            });
        }
        res.status(200).json({
            status: 'success',
            body: subscription,
            message: 'Clinician subscription retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: error.message
        });
    }
};

// Update a clinician subscription
const updateClinicianSubscription = async (req, res) => {
    try {
        const updatedSubscription = await ClinicianSubscription.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('clinician');
        if (!updatedSubscription) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'Subscription not found'
            });
        }

        await sendEmail(
            updatedSubscription.clinician.email,
            'Subscription Update Confirmation',
            `Dear ${updatedSubscription.clinician.name},\n\nYour subscription has been updated successfully.\n\nUpdated Details:\nPatients: ${updatedSubscription.patients}\nEnd Date: ${updatedSubscription.endDate}\nTotal Price: $${updatedSubscription.price}\n\nThank you for your continued subscription!\n\nBest regards,\nYour Company Name`
        );

        res.status(200).json({
            status: 'success',
            body: updatedSubscription,
            message: 'Subscription updated successfully and confirmation email sent'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: error.message
        });
    }
};

// Delete a clinician subscription
const deleteClinicianSubscription = async (req, res) => {
    try {
        const subscription = await ClinicianSubscription.findByIdAndDelete(req.params.id).populate('clinician');
        if (!subscription) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'Subscription not found'
            });
        }

        await sendEmail(
            subscription.clinician.email,
            'Subscription Deletion Confirmation',
            `Dear ${subscription.clinician.name},\n\nYour subscription has been deleted successfully.\n\nIf this was not intended, please contact our support team immediately.\n\nThank you for your past subscription.\n\nBest regards,\nYour Company Name`
        );

        res.status(200).json({
            status: 'success',
            body: null,
            message: 'Subscription deleted successfully and confirmation email sent'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: error.message
        });
    }
};

// Function to check and update expired subscriptions
const checkAndUpdateExpiredSubscriptions = async () => {
    try {
        const currentDate = new Date();
        const expiredSubscriptions = await ClinicianSubscription.find({
            endDate: { $lt: currentDate }
        }).populate('clinician');

        for (const subscription of expiredSubscriptions) {
            await Clinisist.findByIdAndUpdate(subscription.clinician._id, { Active: 'no' });

            await createNotification(
                subscription.clinician._id,
                'Clinisist',
                `Your subscription has expired. Your account has been deactivated.`,
                null,
                null,
                'subscription'
            );

            await sendEmail(
                subscription.clinician.email,
                'Subscription Expiration Notice',
                `Dear ${subscription.clinician.name},\n\nYour subscription has expired. Your account has been deactivated.\n\nPlease renew your subscription to continue using our services.\n\nBest regards,\nYour Company Name`
            );
        }

        console.log(`Checked and updated ${expiredSubscriptions.length} expired clinician subscriptions.`);
    } catch (error) {
        console.error('Error checking and updating expired clinician subscriptions:', error);
    }
};

// Manual trigger for checking and updating expired subscriptions
const manualCheckExpiredSubscriptions = async (req, res) => {
    try {
        await checkAndUpdateExpiredSubscriptions();
        res.status(200).json({
            status: 'success',
            body: null,
            message: 'Expired clinician subscriptions checked and updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: error.message
        });
    }
};

const getClinicianSubscriptionCounts = async (req, res) => {
    try {
        const currentDate = new Date();
        
        const validSubscriptions = await ClinicianSubscription.countDocuments({
            endDate: { $gt: currentDate }
        });
        
        const renewalSubscriptions = await ClinicianSubscription.countDocuments({
            renewal: true
        });
        
        const endedSubscriptions = await ClinicianSubscription.countDocuments({
            endDate: { $lte: currentDate }
        });
        
        res.json({
            status: 'success',
            body: {
                validSubscriptions,
                renewalSubscriptions,
                endedSubscriptions
            },
            message: 'Clinician subscription counts retrieved successfully'
        });
    } catch (error) {
        console.error('Error fetching clinician subscription counts:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error fetching clinician subscription counts'
        });
    }
};

const getMonthlyClinicianSubscriptionStats = async (req, res) => {
    try {
        let { startDate, endDate } = req.query;

        // If no dates are provided, default to this year's data
        if (!startDate || !endDate) {
            startDate = moment().startOf('year').format('YYYY-MM-DD');
            endDate = moment().endOf('year').format('YYYY-MM-DD');
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

        const subscriptions = await ClinicianSubscription.find({
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

        const currentDate = new Date();

        subscriptions.forEach(sub => {
            const subStartMonth = moment(sub.startDate).format('YYYY-MM');
            const subEndMonth = moment(sub.endDate).format('YYYY-MM');

            if (monthlyStats[subStartMonth]) {
                if (sub.renewal) {
                    monthlyStats[subStartMonth].renewal++;
                } else if (sub.endDate > currentDate) {
                    monthlyStats[subStartMonth].valid++;
                } else {
                    monthlyStats[subStartMonth].ended++;
                }
            }
        });

        res.json({
            status: 'success',
            body: monthlyStats,
            message: 'Monthly clinician subscription statistics retrieved successfully'
        });
    } catch (error) {
        console.error('Error fetching monthly clinician subscription stats:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error fetching monthly clinician subscription statistics'
        });
    }
};

// Get subscriptions for a specific clinician
const getClinicianSubscriptions = async (req, res) => {
    try {
        // Find subscriptions for the clinician and populate plan data
        const subscriptions = await ClinicianSubscription.find({ 
            clinician: req.clinisist._id 
        })
        .populate('plan')
        .populate('clinician');

        if (!subscriptions || subscriptions.length === 0) {
            return res.json({
                status: "success",
                body: [],
                message: "No subscriptions found"
            });
        }

        // Map through subscriptions to format response
        const formattedSubscriptions = subscriptions.map(sub => {
            const subscription = sub.toObject();
            
            // Add clinician name if clinician exists
            if (subscription.clinician) {
                subscription.clinicianName = subscription.clinician.name;
            } else {
                subscription.clinicianName = null;
            }

            return subscription;
        });

        res.json({
            status: "success", 
            body: formattedSubscriptions,
            message: "Subscriptions retrieved successfully"
        });
    } catch (err) {
        res.status(500).json({
            status: "error",
            body: null,
            message: err.message
        });
    }
};



module.exports = {
    createClinicianSubscription,
    getAllClinicianSubscriptions,
    getClinicianSubscription,
    updateClinicianSubscription,
    deleteClinicianSubscription,
    checkAndUpdateExpiredSubscriptions,
    manualCheckExpiredSubscriptions,
    getClinicianSubscriptionCounts,
    getMonthlyClinicianSubscriptionStats,
    getClinicianSubscriptions
};
