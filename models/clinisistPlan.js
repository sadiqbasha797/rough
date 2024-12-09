const mongoose = require('mongoose');

const clinicistPlanSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    details: {
        type: String,
        required: true,
        trim: true
    },
    validity: {
        type: Number,
        required: true,
        min: 1,
        comment: 'Validity period in days'
    },
    active: {
        type: Boolean,
        default: true
    },
    planType: {
        type: String,
        required: true,
        enum: ['monthly', 'yearly','quarterly']
    }
}, {
    timestamps: true
});


const ClinicistPlan = mongoose.model('ClinicistPlan', clinicistPlanSchema);

module.exports = ClinicistPlan;
