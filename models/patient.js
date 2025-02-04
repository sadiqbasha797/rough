const mongoose = require('mongoose');
const moment = require('moment');

const addressSchema = new mongoose.Schema({
    latitude: {
        type: Number,
        required: false,
    },
    longitude: {
        type: Number,
        required: false,
    }
});

const patientSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: false,
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
    dateOfBirth: {
        type: Date,
        required: false,
    
    },
    mobile: {
        type: String,
        required: false,
    },
    image: {
        type: String,
        required: false,
    },
    guardian: {
        type: String,
        required: false,
        default: 'No guardian'
    },
    address: addressSchema,
    verified: {
        type: String,
        required: true,
        default: 'no'
    },
    location: {
        type: String,
        required: false,
        default: null
    },
    privacy: {
        type:String,
        required : false,
        default : "Not Agreed"
    },
    location: {
        type:String,
        required : false,
    },
    verificationToken: String,
    tokenExpiration: Date,
    score: {
        type: Number,
        default: 0
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    deviceToken: {
        type: String,
        required: false,
        default: null
    },
}, { timestamps: true });

// Format the date before saving
patientSchema.pre('save', function(next) {
    if (this.dateOfBirth) {
        this.dateOfBirth = moment(this.dateOfBirth).startOf('day').toDate(); // Remove time part
    }
    next();
});

// Format the date when converting to JSON or Object
patientSchema.methods.toJSON = function() {
    const patient = this.toObject();
    patient.dateOfBirth = moment(patient.dateOfBirth).format('DD/MM/YYYY');
    return patient;
};

const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient;
