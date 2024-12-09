const mongoose = require('mongoose');

// Define the schema for the organization
const organizationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    verified: {
        type: Boolean,
        default: true
    },
    image: {
        type: String,
        required: false,
    },      
    otp: {
        type: String,
        default: null,
    },
    otpExpires: {
        type: Date,
        default: null,
    },
    active: {
        type: Boolean,
        default: false
    },
    founder: {
        type: String,
    },
    companyName: {
        type: String,
    },
    established: {
        type: Date,
    },
    address: {
        type: String,
    },
    mobile: {
        type: String,
    },
    certificate: {
        type: String,
        default: null
    },
    socialProfile: {
        instagram: {
            type: String,
            default: null
        },
        twitter: {
            type: String,
            default: null
        },
        facebook: {
            type: String,
            default: null
        },
        linkedin: {
            type: String,
            default: null
        }
    }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Create the model from the schema
const Organization = mongoose.model('Organization', organizationSchema);

module.exports = Organization;
