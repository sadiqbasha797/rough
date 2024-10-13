const express = require('express');
const {
    upload,
    updateDoctor,
    updateDoctorImage,
    getClinisistProfile,
    updatePassword,
    updateUserName,
    deleteClinisist,
    getNotifications,
    getSubscribedPatients,
    getSubscribedPatientsAssessments,
} = require('../controllers/clinisistController'); // Adjust the path as needed
const { clincistProtect } = require('../middleware/auth'); // Middleware to protect routes
const { createPlan, updatePlan, getPlansByClincist, deletePlan } = require('../controllers/planController');

const router = express.Router();

router.get('/profile', clincistProtect, getClinisistProfile);
router.put('/update-password', clincistProtect, updatePassword);
router.put('/update-username', clincistProtect, updateUserName);
router.delete('/delete', clincistProtect, deleteClinisist);
router.route('/create-plan').post(clincistProtect, createPlan);
router.route('/update-plan/:id').put(clincistProtect, updatePlan);
router.route('/my-plans').get(clincistProtect, getPlansByClincist);
router.route('/delete-plan/:id').delete(clincistProtect, deletePlan);//66935d5518e28d2bebaf4341
router.route('/notifications').get(clincistProtect,getNotifications);
router.route('/update-dp/:id').put(clincistProtect, upload.single('image'), updateDoctorImage);
router.put('/update-doctor', clincistProtect, updateDoctor);
router.route('/subscribed-patients').get(clincistProtect, getSubscribedPatients);
router.route('/subscribed-patients-assessments').get(clincistProtect, getSubscribedPatientsAssessments);
module.exports = router;
