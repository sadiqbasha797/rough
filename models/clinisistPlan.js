const mongoose = require('mongoose');

const clinicistPlanSchema = new mongoose.Schema({
    planName: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    description: {
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
    }
}, {
    timestamps: true
});


const ClinicistPlan = mongoose.model('ClinicistPlan', clinicistPlanSchema);

module.exports = ClinicistPlan;
