const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    }, 
    price: {
        type: Number,
        required: true,
        min: 0,
    }, 
    details: {
        type: String,
        required: true,
    },
    validity: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active',
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Clinisist',
        required: false,
    },
    planType: { // Adding planType field with specific allowed values
        type: String,
        enum: ['portal-plan', 'doctor-plan', 'organization-plan'],
        required: true,
    }
}, {
    timestamps: true,
});

const Plan = mongoose.model('Plan', planSchema);

module.exports = Plan;