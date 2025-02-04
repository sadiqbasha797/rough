const mongoose = require('mongoose');

const managerSchema = new mongoose.Schema({
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
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
    },
    otp: {
        type: String,
        default: null,
    },
    mobile : {
        type : String,
        required : false,
    },
    image : {
        type : String,
        required : false,
    },      
    otpExpires: {
        type: Date,
        default: null,
    },
    Active : {
      type : String,
      default : "yes"
    }
    
}, {
    timestamps: true, // Automatically adds `createdAt` and `updatedAt` fields
});

const Manager = mongoose.model('Manager', managerSchema);

module.exports = Manager;
