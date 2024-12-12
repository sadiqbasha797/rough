const crypto = require('crypto');

const generateOTP = () => {
    // Generate a random OTP
    const otp = crypto.randomInt(100000, 999999).toString(); // 6-digit OTP

    // Set OTP expiration time (e.g., 10 minutes)
    const otpExpires = Date.now() + 600000;

    return { otp, otpExpires };
};

module.exports = generateOTP;
