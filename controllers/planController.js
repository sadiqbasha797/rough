const Plan = require('../models/plan');
const Subscription = require('../models/subscription');
const Clinisist = require('../models/Clinisist');
const Patient = require('../models/patient');

const createPlan = async (req, res) => {
    const { name, price, details, validity } = req.body;
    try {
        const plan = new Plan({
            name,
            price: parseFloat(price).toFixed(2),
            details,
            validity,
            createdBy: req.admin._id,
            planType: 'doctor-plan'
        });

        const createdPlan = await plan.save();
        res.status(201).json(createdPlan);
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: err.message,
        });
    }
};

const createPortalPlan = async (req, res) => {
    const { name, price, details, validity, planType } = req.body;
    try {
        const plan = new Plan({
            name,
            price: parseFloat(price).toFixed(2),
            details,
            validity,
            createdBy: req.admin._id,
            planType: planType
        });

        const createdPlan = await plan.save();
        res.status(201).json(createdPlan);
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: err.message,
        });
    }
};


const updatePlan = async (req, res) => {
    const {id} = req.params;
    const {name, price, details, validity, status, planType} = req.body;

    try {
        const plan = await Plan.findById(id);

        if (!plan) {
            return res.status(404).json({
                message: 'Plan not found',
            });
        }
      
        
        plan.name = name || plan.name;
        plan.price = price || plan.price;
        plan.details = details || plan.details;
        plan.validity = validity || plan.validity;
        plan.status = status || plan.status;
        plan.planType = planType || plan.planType;
        const updatedPlan = await plan.save();

        res.json(updatedPlan);
    } catch (err) {
        res.status(500).json({
            message: err.message,
        });
    }
};


const deletePlan = async (req, res) => {
    try {
        const planId = req.params.id;
        const clinisistId = req.clinisist._id;

        const plan = await Plan.findById(planId);

        if (!plan) {
            return res.status(404).json({
                message: "Plan not found",
            });
        }

        if (plan.createdBy.toString() !== clinisistId.toString()) {
            return res.status(403).json({
                message: "Not authorized",
            });
        }

        const activeSubscriptions = await Subscription.find({plan: planId});

        if (activeSubscriptions.length > 0) {
            plan.status = 'Inactive';
            await plan.save();
            return res.status(400).json({
                message: 'Cant delete plan with active users',
            });
        }

        await Plan.deleteOne({_id: planId});
        res.json({
            message: 'Plan deleted Sucesfully',
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: err.message,
        });
    }
};

const getPlansByClincist = async (req, res) => {
    try {
        const plans = await Plan.find({createdBy: req.clinisist._id});
        res.json(plans);
    } catch (err) {
        res.status(500).json({
            message: err.message,
        })
    }
};

const showActivePlans = async (req, res) => {
    try {
        const plans = await Plan.find({status: 'Active'});
        res.json(plans);
    } catch (err) {
        res.status(500).json({
            message: err.message,
        });
    }
};

const getDoctorPlans = async (req, res) => {
    try {
        const doctorPlans = await Plan.find({ planType: 'doctor-plan', status: 'Active' });
        const formattedPlans = doctorPlans.map(plan => ({
            ...plan.toObject(),
            price: parseFloat(plan.price) // Ensure price is a double
        }));
        res.json({
            status: "success",
            body: formattedPlans,
            message: "Doctor plans retrieved successfully"
        });
    } catch (err) {
        res.status(500).json({
            status: "error",
            body: null,
            message: err.message
        });
    }
};

const getPortalPlans = async (req, res) => {
    try {
        const portalPlans = await Plan.find({ planType: 'portal-plan', status: 'Active' });
        const formattedPlans = portalPlans.map(plan => ({
            ...plan.toObject(),
            price: parseFloat(plan.price) // Ensure price is a double
        }));
        res.json({
            status: "success",
            body: formattedPlans,
            message: "Portal plans retrieved successfully"
        });
    } catch (err) {
        res.status(500).json({
            status: "error",
            body: null,
            message: err.message
        });
    }
};

const getOrganizationPlans = async (req, res) => {
    try {
        const organizationPlans = await Plan.find({ planType: 'organization-plan', status: 'Active' });
        const formattedPlans = organizationPlans.map(plan => ({
            ...plan.toObject(),
            price: parseFloat(plan.price) // Ensure price is a double
        }));
        res.json({
            status: "success",
            body: formattedPlans,
            message: "Organization plans retrieved successfully"
        });
    } catch (err) {
        res.status(500).json({
            status: "error",
            body: null,
            message: err.message
        });
    }
};

const getPlanById = async (req, res) => {
    try {
        const plan = await Plan.findById(req.params.id);
        
        if (!plan) {
            return res.status(404).json({
                status: "error",
                body: null,
                message: "Plan not found"
            });
        }

        res.json({
            status: "success",
            body: {
                ...plan.toObject(),
                price: parseFloat(plan.price) // Ensure price is returned as double
            },
            message: "Plan retrieved successfully"
        });
    } catch (err) {
        console.error('Error fetching plan:', err);
        res.status(500).json({
            status: "error",
            body: null,
            message: err.message
        });
    }
};

module.exports = {
    createPlan, 
    updatePlan, 
    getPlansByClincist, 
    deletePlan, 
    showActivePlans,
    createPortalPlan,
    getDoctorPlans,
    getPortalPlans,
    getOrganizationPlans,
    getPlanById,
};
