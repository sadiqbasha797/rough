const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    companyName: {
        type: String,
    },
    address: {
        type: String,
    },
    companyImage: {
        type: String,
    },
    socialMediaLinks: {
        twitter: {
            type: String
        },
        email: {
            type: String
        },
        facebook: {
            type: String
        },
        instagram: {
            type: String
        },
        linkedin: {
            type: String
        }
    },
    contact: {
        email: {
            type: String,
        },
        mobile: {
            type: String,
        }
    },
    founderName: {
        type: String,
    },
    established: {
        type: Date,
    },
    bio: {
        type: String,
    },
    image: {
        type: String,
    },
    otp: {
        type: String,
        default: null,
    },
    otpExpires: {
        type: Date,
        default: null,
    },
});

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;