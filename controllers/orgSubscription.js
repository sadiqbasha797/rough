const OrgSubscription = require('../models/org-subsciption');
const Organization = require('../models/organization');
const createNotification = require('../utils/createNotification');
const sendEmail = require('../utils/mailUtil');
const Clinisist = require('../models/Clinisist');

// Create a new organization subscription or renew existing one
const createOrgSubscription = async (req, res) => {
    try {
        const { organizationId, clinicians, price, validity } = req.body;

        // Fetch the organization
        const organization = await Organization.findById(organizationId);
        console.log(organization);
        if (!organization) {
            return res.status(404).json({
                status: 'error',
                message: 'Organization not found'
            });
        }

        // Calculate start date and end date based on validity
        const startDate = new Date();
        const endDate = new Date(startDate.getTime() + validity * 24 * 60 * 60 * 1000);

        // Check if a subscription already exists for this organization
        let subscription = await OrgSubscription.findOne({ organization: organizationId });
        let isRenewal = false;

        if (subscription) {
            // Update existing subscription
            subscription.clinicians = clinicians;
            subscription.price = price;
            subscription.startDate = startDate;
            subscription.endDate = endDate;
            subscription.validity = validity;
            subscription.renewal = true;
            isRenewal = true;
        } else {
            // Create new subscription
            subscription = new OrgSubscription({
                organization: organizationId,
                clinicians,
                price,
                startDate,
                endDate,
                validity,
                renewal: false
            });
        }

        await subscription.save();

        // Update organization's active status to true
        await Organization.findByIdAndUpdate(organizationId, { active: true });

        // Update all linked clinicians' active status to 'yes'
        await Clinisist.updateMany(
            { organization: organizationId },
            { Active: 'yes' }
        );

        // Create notification for the organization
        try {
            const notificationMessage = isRenewal
                ? `Subscription renewed for ${clinicians} clinicians.`
                : `New subscription created for ${clinicians} clinicians.`;
            const notification = await createNotification(
                organizationId,
                'Organization',
                notificationMessage,
                null,
                null,
                'subscription'
            );
            console.log('Notification created:', notification);

            // Create notification for admin
            const adminNotificationMessage = isRenewal
                ? `Organization ${organization.name} renewed subscription for ${clinicians} clinicians.`
                : `Organization ${organization.name} created new subscription for ${clinicians} clinicians.`;
            const adminNotification = await createNotification(
                null,
                'Admin',
                adminNotificationMessage,
                null,
                null,
                'subscription'
            );
            console.log('Admin notification created:', adminNotification);
        } catch (notificationError) {
            console.error('Failed to create notification:', notificationError);
        }

        // Send email to the organization
        const emailSubject = isRenewal ? 'Subscription Renewal Confirmation' : 'New Subscription Confirmation';
        const emailBody = `Dear ${organization.name},\n\n${isRenewal ? 'Your subscription has been renewed' : 'Your new subscription has been created'} successfully.\n\nDetails:\nClinicians: ${clinicians}\nStart Date: ${startDate}\nEnd Date: ${endDate}\nValidity: ${validity} days\nTotal Price: $${price}\n\nYour organization is now active and all linked clinicians have been activated.\n\nThank you for your subscription!\n\nBest regards,\nYour Company Name`;

        await sendEmail(
            organization.email,
            emailSubject,
            emailBody
        );

        res.status(201).json({
            status: 'success',
            data: subscription,
            message: `Organization subscription ${isRenewal ? 'renewed' : 'created'} successfully, organization and clinicians activated, and confirmation email sent`
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Get all organization subscriptions
const getAllOrgSubscriptions = async (req, res) => {
    try {
        const subscriptions = await OrgSubscription.find().populate('organization');
        res.status(200).json({
            status: 'success',
            data: subscriptions
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Get a specific organization subscription
const getOrgSubscription = async (req, res) => {
    try {
        const subscription = await OrgSubscription.findById(req.params.id).populate('organization');
        if (!subscription) {
            return res.status(404).json({
                status: 'error',
                message: 'Subscription not found'
            });
        }
        res.status(200).json({
            status: 'success',
            data: subscription
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Update an organization subscription
const updateOrgSubscription = async (req, res) => {
    try {
        const updatedSubscription = await OrgSubscription.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('organization');
        if (!updatedSubscription) {
            return res.status(404).json({
                status: 'error',
                message: 'Subscription not found'
            });
        }

        // Send email to the organization about the update
        await sendEmail(
            updatedSubscription.organization.email,
            'Subscription Update Confirmation',
            `Dear ${updatedSubscription.organization.name},\n\nYour subscription has been updated successfully.\n\nUpdated Details:\nClinicians: ${updatedSubscription.clinicians}\nEnd Date: ${updatedSubscription.endDate}\nTotal Price: $${updatedSubscription.price}\n\nThank you for your continued subscription!\n\nBest regards,\nYour Company Name`
        );

        res.status(200).json({
            status: 'success',
            data: updatedSubscription,
            message: 'Subscription updated successfully and confirmation email sent'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Delete an organization subscription
const deleteOrgSubscription = async (req, res) => {
    try {
        const subscription = await OrgSubscription.findByIdAndDelete(req.params.id).populate('organization');
        if (!subscription) {
            return res.status(404).json({
                status: 'error',
                message: 'Subscription not found'
            });
        }

        // Send email to the organization about the deletion
        await sendEmail(
            subscription.organization.email,
            'Subscription Deletion Confirmation',
            `Dear ${subscription.organization.name},\n\nYour subscription has been deleted successfully.\n\nIf this was not intended, please contact our support team immediately.\n\nThank you for your past subscription.\n\nBest regards,\nYour Company Name`
        );

        res.status(200).json({
            status: 'success',
            message: 'Subscription deleted successfully and confirmation email sent'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Function to check and update expired subscriptions
const checkAndUpdateExpiredSubscriptions = async () => {
    try {
        const currentDate = new Date();

        // Find all expired subscriptions
        const expiredSubscriptions = await OrgSubscription.find({
            endDate: { $lt: currentDate }
        }).populate('organization');

        for (const subscription of expiredSubscriptions) {
            // Update organization's active status to false
            await Organization.findByIdAndUpdate(subscription.organization._id, { active: false });

            // Update all linked clinicians' active status to 'no'
            await Clinisist.updateMany(
                { organization: subscription.organization._id },
                { Active: 'no' }
            );

            // Create a notification for the organization
            await createNotification(
                subscription.organization._id,
                'Organization',
                `Your subscription has expired. Your organization and associated clinicians have been deactivated.`,
                null,
                null,
                'subscription'
            );

            // Send an email to the organization
            await sendEmail(
                subscription.organization.email,
                'Subscription Expiration Notice',
                `Dear ${subscription.organization.name},\n\nYour subscription has expired. Your organization and all associated clinicians have been deactivated.\n\nPlease renew your subscription to continue using our services.\n\nBest regards,\nYour Company Name`
            );
        }

        console.log(`Checked and updated ${expiredSubscriptions.length} expired subscriptions.`);
    } catch (error) {
        console.error('Error checking and updating expired subscriptions:', error);
    }
};

// Manual trigger for checking and updating expired subscriptions
const manualCheckExpiredSubscriptions = async (req, res) => {
    try {
        await checkAndUpdateExpiredSubscriptions();
        res.status(200).json({
            status: 'success',
            message: 'Expired subscriptions checked and updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Get subscription counts
const getSubscriptionCounts = async (req, res) => {
    try {
        const currentDate = new Date();

        const validSubscriptions = await OrgSubscription.countDocuments({
            endDate: { $gte: currentDate }
        });

        const renewalSubscriptions = await OrgSubscription.countDocuments({
            renewal: true
        });

        const endedSubscriptions = await OrgSubscription.countDocuments({
            endDate: { $lt: currentDate }
        });

        res.status(200).json({
            status: 'success',
            data: {
                validSubscriptions,
                renewalSubscriptions,
                endedSubscriptions
            },
            message: 'Subscription counts retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Check if an organization has any previous subscription (active or expired)
const checkOrganizationPreviousSubscription = async (req, res) => {
    try {
        const organizationId = req.params.id;
        const previousSubscription = await OrgSubscription.findOne({ organization: organizationId });
        res.status(200).json({
            status: 'success',
            body: { hasPreviousSubscription: !!previousSubscription },
            message: !!previousSubscription ? 'Previous subscription found' : 'No previous subscription found'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error checking previous subscription'
        });
    }
};

module.exports = {
    createOrgSubscription,
    getAllOrgSubscriptions,
    getOrgSubscription,
    updateOrgSubscription,
    deleteOrgSubscription,
    checkAndUpdateExpiredSubscriptions,
    manualCheckExpiredSubscriptions,
    getSubscriptionCounts,
    checkOrganizationPreviousSubscription
};
