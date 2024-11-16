const bcrypt = require('bcryptjs');
const OrgAdmin = require('../models/orgAdmin'); // Change this for different models
const Manager = require('../models/manager');   // Change this for different models
const Organization = require('../models/organization'); // Change this for different models
const Admin = require('../models/admin');
const Assistant = require('../models/assistant');

const resetPassword = async (req, res, userModel) => {
    const { otp, newPassword } = req.body;

    try {
        // Find user by OTP and check if OTP is expired
        const user = await userModel.findOne({
            otp,
            otpExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                status: 'error',
                body: null,
                message: 'Invalid or expired OTP'
            });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's password and clear OTP fields
        user.password = hashedPassword;
        user.otp = null;
        user.otpExpires = null;

        await user.save();

        res.status(200).json({
            status: 'success',
            body: null,
            message: 'Password reset successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: error.message
        });
    }
};

module.exports = resetPassword;
