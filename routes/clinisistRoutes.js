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
    getAssessmentInfoByPatientId,
    getClinicistSubscriptionStats,
    getClinicistSalesStats,
    getClinicistRecommendationStats,
    getNearbySubscribedPatientsAssessments,
    getClinicistRecommendationsAndPatients,
    updateLicenseImage
} = require('../controllers/clinisistController'); // Adjust the path as needed
const { clincistProtect } = require('../middleware/auth'); // Middleware to protect routes
const { createPlan, updatePlan, getPlansByClincist, deletePlan } = require('../controllers/planController');
const { checkClinicistActiveSubscription } = require('../controllers/subscriptionController');
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
router.route('/subscribed-patient-assessment-infos/:patientId').get(clincistProtect, getAssessmentInfoByPatientId);
router.route('/subscription-stats').get(clincistProtect, getClinicistSubscriptionStats);
router.route('/sales-stats').get(clincistProtect, getClinicistSalesStats);
router.route('/recommendation-stats').get(clincistProtect, getClinicistRecommendationStats);
router.route('/nearby-subscribed-patients-assessments').post(clincistProtect, getNearbySubscribedPatientsAssessments);
router.route('/recommended-patients').get(clincistProtect, getClinicistRecommendationsAndPatients);
router.route('/check-active-subscription').get(clincistProtect, checkClinicistActiveSubscription);
router.put(
    '/update-license-image',
    clincistProtect,
    upload.single('licenseImage'),
    updateLicenseImage
);
module.exports = router;
