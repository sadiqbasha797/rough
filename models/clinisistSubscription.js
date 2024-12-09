    const mongoose = require('mongoose');

    const clinicianSubscriptionSchema = new mongoose.Schema({
        clinician: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Clinisist',
            required: true
        },
        patients: {
            type: Number,
            required: false,
            min: 0
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
            min: 0
        },
        renewal: {
            type: Boolean,
            default: false
        },
        description: {
            type: String,
            required: false
        },
        active: {
            type: Boolean,
            default: true
        },
        plan: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ClinicistPlan',
            required: true
        }
    }, {
        timestamps: true
    });

    const ClinicianSubscription = mongoose.model('ClinicianSubscription', clinicianSubscriptionSchema);

    module.exports = ClinicianSubscription;
