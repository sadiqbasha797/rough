const Subscription = require('../models/subscription');
const Plan = require('../models/plan');
const createNotification = require('../utils/createNotification');
const Clinisist = require('../models/Clinisist');
const patient = require('../models/patient');
const ClinicianSubscription = require('../models/clinisistSubscription');
const createSubscription = async (req, res) => {
    const { planId } = req.params;
    const { clinisistId } = req.body; // New input for organization plans

    try {
        const plan = await Plan.findById(planId);
        if (!plan) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: "Plan not found"
            });
        }

        // Check if the patient has an existing subscription to this plan
        let existingSubscription = await Subscription.findOne({
            patient: req.patient._id,
            plan: planId,
        });

        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + plan.validity);

        // Determine the clinisist ID or organization ID based on the plan type
        let subscriptionClinisistId = null;
        let organizationId = null;
        if (plan.planType === 'doctor-plan') {
            subscriptionClinisistId = clinisistId;
        } else if (plan.planType === 'organization-plan') {
            organizationId = plan.createdBy;
            subscriptionClinisistId = clinisistId || null; // Use the provided clinisistId or null if not passed
        }

        let createdSubscription;

        if (existingSubscription) {
            // If the existing subscription has expired, update it
            if (existingSubscription.endDate < new Date()) {
                existingSubscription.startDate = startDate;
                existingSubscription.endDate = endDate;
                existingSubscription.clinisist = subscriptionClinisistId;
                existingSubscription.organization = organizationId;
                existingSubscription.renewal = true; // Set renewal to true
                createdSubscription = await existingSubscription.save();
            } else {
                // If the subscription is still active, return an error
                return res.status(409).json({
                    status: 'error',
                    body: null,
                    message: `You are already subscribed to the plan "${plan.name}". The plan is valid until ${existingSubscription.endDate.toISOString().split('T')[0]}.`
                });
            }
        } else {
            // If no existing subscription, create a new one
            const newSubscription = new Subscription({
                patient: req.patient._id,
                plan: planId,
                clinisist: subscriptionClinisistId,
                organization: organizationId,
                startDate,
                endDate,
                renewal: false, // Set renewal to false for new subscriptions
            });
            createdSubscription = await newSubscription.save();
        }

        // Modified notification logic for portal-plan
        if (plan.planType === 'portal-plan') {
            // Create notification for the patient
            const patientMessage = `You have successfully ${existingSubscription ? 'renewed' : 'subscribed to'} the portal plan "${plan.name}".`;
            await createNotification(
                req.patient._id,  // recipient
                'Patient',        // recipientModel
                patientMessage,
                null,            // sender
                null,            // senderModel
                'subscription'
            );

            // Create notification for the portal (with null recipient and sender)
            const portalMessage = `A new patient has ${existingSubscription ? 'renewed' : 'subscribed to'} the portal plan "${plan.name}".`;
            await createNotification(
                null,            // recipient
                'Admin',            // recipientModel
                portalMessage,
                null,            // sender
                null,            // senderModel
                'subscription'
            );
        } else {
            // Notify the patient
            const patientMessage = `You have successfully ${existingSubscription ? 'renewed' : 'subscribed to'} the plan "${plan.name}".`;
            await createNotification(
                req.patient._id, 
                'Patient', 
                patientMessage, 
                null, 
                null, 
                'subscription'
            );

            // Notify the clinician and create admin notification for doctor-plan
            if (subscriptionClinisistId) {
                const clinician = await Clinisist.findById(subscriptionClinisistId);
                if (clinician) {
                    // Notify clinician
                    const clinicianMessage = `A patient has ${existingSubscription ? 'renewed' : 'subscribed to'} ${plan.planType === 'organization-plan' ? 'an organization' : 'your'} plan "${plan.name}".`;
                    await createNotification(
                        clinician._id, 
                        'Clinisist', 
                        clinicianMessage, 
                        req.patient._id, 
                        'Patient', 
                        'subscription'
                    );

                    // Create admin notification for doctor-plan
                    if (plan.planType === 'doctor-plan') {
                        const adminMessage = `A patient has ${existingSubscription ? 'renewed' : 'subscribed to'} a doctor plan "${plan.name}" with Dr. ${clinician.name}.`;
                        await createNotification(
                            null,            // recipient
                            'Admin',         // recipientModel
                            adminMessage,
                            null,            // sender
                            null,            // senderModel
                            'subscription'
                        );
                    }
                }
            }

            // Notify the organization (for organization-plan)
            if (organizationId) {
                const organizationMessage = `A patient has ${existingSubscription ? 'renewed' : 'subscribed to'} your organization plan "${plan.name}".`;
                await createNotification(
                    organizationId, 
                    'Organization', 
                    organizationMessage, 
                    req.patient._id, 
                    'Patient', 
                    'subscription'
                );
            }
        }

        res.status(201).json({
            status: 'success',
            body: createdSubscription,
            message: `Subscription ${existingSubscription ? 'renewed' : 'created'} successfully`
        });

    } catch (err) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: err.message
        });
    }
};


const getSubscriptionByPatient = async (req, res) => {
    try {
        // Find subscriptions for the patient
        const subscriptions = await Subscription.find({ patient: req.patient._id })
            .populate({
                path: 'plan',
                populate: {
                    path: 'createdBy', // Populate the clinician info from the plan
                    model: 'Clinisist'
                }
            });

        if (!subscriptions || subscriptions.length === 0) {
            return res.json({
                status: "success", 
                body: [],
                message: "No subscriptions found"
            });
        }

        // Map through subscriptions to conditionally include clinician name
        const subscriptionsWithOptionalClinicianName = subscriptions.map(sub => {
            if (sub.plan.type === 'doctor-plan' && sub.plan.createdBy) {
                // Add clinician name only if the plan type is 'doctor-plan'
                return {
                    ...sub.toObject(), // Spread the subscription object
                    clinicianName: sub.plan.createdBy ? sub.plan.createdBy.name : null // Add clinician name
                };
            } else {
                // Return subscription without clinician name if plan type is not 'doctor-plan'
                return {
                    ...sub.toObject(), // Spread the subscription object
                    clinicianName: null // No clinician name for non 'doctor-plan'
                };
            }
        });

        res.json({
            status: "success",
            body: subscriptionsWithOptionalClinicianName,
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

const getSubscribedClinicians = async (req, res) => {
    try {
        // Fetch subscriptions for the patient and populate both plan and clinisist details
        const subscriptions = await Subscription.find({ patient: req.patient._id })
            .populate({
                path: 'plan',
                model: 'Plan'
            })
            .populate({
                path: 'clinisist',
                model: 'Clinisist'
            });

        if (!subscriptions || subscriptions.length === 0) {
            return res.json({
                status: 'success',
                body: [],
                message: 'No subscribed clinicians found'
            });
        }

        // Filter out subscriptions with null clinicians and format the response data
        const response = subscriptions
            .filter(subscription => subscription.clinisist !== null)
            .map(subscription => ({
                plan: subscription.plan,
                clinician: subscription.clinisist
            }));

        if (response.length === 0) {
            return res.json({
                status: 'success',
                body: [],
                message: 'No subscribed clinicians found'
            });
        }

        res.json({
            status: 'success',
            body: response,
            message: 'Subscribed clinicians and plans retrieved successfully'
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: err.message
        });
    }
};

const checkActiveSubscription = async (req, res) => {
    try {
        const patientId = req.patient._id;
        const currentDate = new Date();

        // Find any active subscription for the patient, excluding clinisist and organization subscriptions
        const activeSubscription = await Subscription.findOne({
            patient: patientId,
            clinisist: null,
            organization: null,
            startDate: { $lte: currentDate },
            endDate: { $gte: currentDate }
        }).populate('plan');

        if (!activeSubscription) {
            return res.status(200).json({
                status: 'success',
                body: {
                    hasActiveSubscription: false
                },
                message: 'No active subscription found'
            });
        }

        res.status(200).json({
            status: 'success',
            body: {
                hasActiveSubscription: true,
                subscription: {
                    plan: activeSubscription.plan,
                    startDate: activeSubscription.startDate,
                    endDate: activeSubscription.endDate,
                    renewal: activeSubscription.renewal
                }
            },
            message: 'Active subscription found'
        });

    } catch (error) {
        console.error('Error checking active subscription:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error checking subscription status'
        });
    }
};

const checkClinicistActiveSubscription = async (req, res) => {
    try {
        const clinicistId = req.clinisist._id;
        const currentDate = new Date();

        // Find any active subscription for the clinician
        const activeSubscription = await ClinicianSubscription.findOne({
            clinician: clinicistId,
            startDate: { $lte: currentDate },
            endDate: { $gte: currentDate },
            active: true
        });

        if (!activeSubscription) {
            return res.status(200).json({
                status: 'success',
                body: {
                    hasActiveSubscription: false
                },
                message: 'No active subscription found'
            });
        }

        res.status(200).json({
            status: 'success', 
            body: {
                hasActiveSubscription: true,
                subscription: {
                    patients: activeSubscription.patients,
                    price: activeSubscription.price,
                    startDate: activeSubscription.startDate,
                    endDate: activeSubscription.endDate,
                    validity: activeSubscription.validity,
                    renewal: activeSubscription.renewal,
                    description: activeSubscription.description
                }
            },
            message: 'Active subscription found'
        });

    } catch (error) {
        console.error('Error checking clinician active subscription:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error checking subscription status'
        });
    }
};

const checkPatientClinicistSubscription = async (req, res) => {
    try {
        const patientId = req.patient._id;
        const currentDate = new Date();

        // Find any active subscription for the patient with any clinicist
        const activeSubscription = await Subscription.findOne({
            patient: patientId,
            clinisist: { $ne: null }, // Check for any clinicist subscription
            startDate: { $lte: currentDate },
            endDate: { $gte: currentDate }
        });

        if (!activeSubscription) {
            return res.status(200).json({
                status: 'success',
                body: {
                    hasActiveSubscription: false
                },
                message: 'No active subscription found with any clinician'
            });
        }

        // Get plan details
        const plan = await Plan.findById(activeSubscription.plan);

        res.status(200).json({
            status: 'success',
            body: {
                hasActiveSubscription: true,
                subscription: {
                    startDate: activeSubscription.startDate,
                    endDate: activeSubscription.endDate,
                    planName: plan.name,
                    planValidity: plan.validity,
                    renewal: activeSubscription.renewal
                }
            },
            message: 'Active subscription found with a clinician'
        });

    } catch (error) {
        console.error('Error checking patient-clinician subscription:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error checking subscription status'
        });
    }
};

const checkPatientPreviousSubscription = async (req, res) => {
    try {
        const patientId = req.patient._id;
        const previousSubscription = await Subscription.findOne({ patient: patientId });
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
    createSubscription, 
    getSubscriptionByPatient, 
    getSubscribedClinicians,
    checkActiveSubscription,
    checkClinicistActiveSubscription,
    checkPatientClinicistSubscription,
    checkPatientPreviousSubscription
};