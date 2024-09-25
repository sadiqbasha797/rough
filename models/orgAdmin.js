const mongoose = require('mongoose');

const orgAdminSchema = new mongoose.Schema({
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
    otpExpires: {
        type: Date,
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
    Active : {
        type : String,
        default : "yes"
    }
    
}, {
    timestamps: true, 
});

const OrgAdmin = mongoose.model('OrgAdmin', orgAdminSchema);

module.exports = OrgAdmin;
