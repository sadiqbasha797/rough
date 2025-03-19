const express = require('express');
const {authPatient, registerPatient,registerClinisist, authClinisist, verifyEmail, resetPassword, sendPasswordResetEmail, resendVerificationEmail} = require('../controllers/authController');
const { upload } = require('../controllers/clinisistController'); // Add this line
const router = express.Router();

router.post('/patient-register', registerPatient);
router.post('/patient-login', authPatient);
router.get('/verify/:token', verifyEmail);

router.post('/doctor-register', upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'licenseImage', maxCount: 1 }
]), registerClinisist);
router.post('/doctor-login', authClinisist);
router.post('/request-password-reset', sendPasswordResetEmail);
router.post('/reset/:token', resetPassword);
router.post('/resend-verification', resendVerificationEmail);

module.exports = router;