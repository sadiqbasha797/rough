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
    verified :{
        type : Boolean,
        default : false
    },
    image : {
        type : String,
        required : false,
    },      
    otp: {
        type: String,
        default: null,
    },
    otpExpires: {
        type: Date,
        default: null,
    },
    active : {
        type : Boolean,
        default : false
    }
    
}, {
    timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Create the model from the schema
const Organization = mongoose.model('Organization', organizationSchema);

module.exports = Organization;
