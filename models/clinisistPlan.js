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
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    validity: {
        type: Number,
        required: true,
        min: 1,
        comment: 'Validity period in days'
    }
}, {
    timestamps: true
});

// Validate that endDate is after startDate
clinicistPlanSchema.pre('save', function(next) {
    if (this.endDate <= this.startDate) {
        next(new Error('End date must be after start date'));
    } else {
        next();
    }
});

const ClinicistPlan = mongoose.model('ClinicistPlan', clinicistPlanSchema);

module.exports = ClinicistPlan;
