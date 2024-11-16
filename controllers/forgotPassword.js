const generateOTP = require('../utils/generateOtp');
const sendEmail = require('../utils/mailUtil');
const OrgAdmin = require('../models/orgAdmin');
const Manager = require('../models/manager');
const Organization = require('../models/organization');
const Admin = require('../models/admin');
const Assistant = require('../models/assistant');

const forgotPassword = async (req, res, userModel) => {
    const { email, userType } = req.body;

    try {
        let model;
        switch(userType) {
            case 'admin':
                model = Admin;
                break;
            case 'assistant': 
                model = Assistant;
                break;
            case 'orgAdmin':
                model = OrgAdmin;
                break;
            case 'manager':
                model = Manager;
                break;
            case 'organization':
                model = Organization;
                break;
            default:
                model = userModel;
        }

        // Find user by email
        const user = await model.findOne({ email });

        if (!user) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'No user found with that email address'
            });
        }

        // Generate OTP
        const { otp, otpExpires } = generateOTP();

        // Set OTP and expiration time in user model
        user.otp = otp;
        user.otpExpires = otpExpires;

        await user.save();

        // Send OTP email
        const message = `Your OTP code is ${otp}. It is valid for 10 minutes.`;
        await sendEmail(user.email, 'Password Reset OTP', message);

        res.status(200).json({
            status: 'success',
            body: null,
            message: 'OTP sent to your email'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: error.message
        });
    }
};

module.exports = forgotPassword;
