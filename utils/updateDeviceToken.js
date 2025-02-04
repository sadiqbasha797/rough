const Patient = require('../models/patient');
const Clinisist = require('../models/Clinisist');

async function updateDeviceToken(userId, userType, deviceToken) {
  try {
    const Model = userType === 'Patient' ? Patient : Clinisist;
    await Model.findByIdAndUpdate(userId, { deviceToken });
    console.log(`Device token updated for ${userType} ${userId}`);
    return true;
  } catch (error) {
    console.error('Error updating device token:', error);
    return false;
  }
}

module.exports = updateDeviceToken; 