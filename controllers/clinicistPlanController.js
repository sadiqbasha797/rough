const ClinicistPlan = require('../models/clinisistPlan');

// Create a new clinicist plan
const createClinicistPlan = async (req, res) => {
    try {
        const { planName, price, description, validity, active } = req.body;
        const newPlan = new ClinicistPlan({
            planName,
            price,
            description,
            validity,
            active
        });
        
        const savedPlan = await newPlan.save();
        res.status(201).json({
            status: 'success',
            body: savedPlan,
            message: 'Clinicist plan created successfully'
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};

// Get all clinicist plans
const getAllClinicistPlans = async (req, res) => {
    try {
        const plans = await ClinicistPlan.find();
        res.status(200).json({
            status: 'success',
            body: plans,
            message: 'Clinicist plans retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Get a clinicist plan by ID
const getClinicistPlanById = async (req, res) => {
    try {
        const plan = await ClinicistPlan.findById(req.params.id);
        if (!plan) {
            return res.status(404).json({
                status: 'error',
                message: 'Clinicist plan not found'
            });
        }
        res.status(200).json({
            status: 'success',
            body: plan,
            message: 'Clinicist plan retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Update a clinicist plan
const updateClinicistPlan = async (req, res) => {
    try {
        const { planName, price, description, validity, active } = req.body;
        const updatedPlan = await ClinicistPlan.findByIdAndUpdate(
            req.params.id,
            { planName, price, description, validity, active },
            { new: true, runValidators: true }
        );
        
        if (!updatedPlan) {
            return res.status(404).json({
                status: 'error',
                message: 'Clinicist plan not found'
            });
        }
        
        res.status(200).json({
            status: 'success',
            body: updatedPlan,
            message: 'Clinicist plan updated successfully'
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};

// Delete a clinicist plan
const deleteClinicistPlan = async (req, res) => {
    try {
        const deletedPlan = await ClinicistPlan.findByIdAndDelete(req.params.id);
        if (!deletedPlan) {
            return res.status(404).json({
                status: 'error',
                message: 'Clinicist plan not found'
            });
        }
        res.status(200).json({
            status: 'success',
            body: null,
            message: 'Clinicist plan deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Get all active clinicist plans
const getActiveClinicistPlans = async (req, res) => {
    try {
        const activePlans = await ClinicistPlan.find({ active: true });
        res.status(200).json({
            status: 'success',
            body: activePlans,
            message: 'Active clinicist plans retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

module.exports = {
    createClinicistPlan,
    getAllClinicistPlans,
    getClinicistPlanById,
    updateClinicistPlan,
    deleteClinicistPlan,
    getActiveClinicistPlans
};
