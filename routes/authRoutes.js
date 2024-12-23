const express = require('express');
const {authPatient, registerPatient,registerClinisist, authClinisist, verifyEmail, resetPassword, sendPasswordResetEmail} = require('../controllers/authController');
const router = express.Router();

router.post('/patient-register', registerPatient);
router.post('/patient-login', authPatient);
router.get('/verify/:token', verifyEmail);

router.post('/doctor-register', registerClinisist);
router.post('/doctor-login', authClinisist);
router.post('/request-password-reset', sendPasswordResetEmail);
router.post('/reset/:token', resetPassword);

module.exports = router;