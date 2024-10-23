const express = require('express');
const router = express.Router();
const {adminAuth} = require('../middleware/adminAuth');
const { 
    updateAdminName, 
    updateAdminPassword,
    getAllOrganizations,
    getOrganizationStats,
    registerAdmin,
    loginAdmin,
    getPatients,
    getDoctors,
    verifyDoctor,
    getPortalPlans, // Add this new import
    getPortalPlanById,
    updatePortalPlan,
    deletePortalPlan,
    getPortalPlanSubscriptions,
    getPortalPlanSubscriptionCounts,
    getPortalPlanEarnings,
    getPortalPlanEarningsSummary,
    getPortalClinicians,
    updatePortalClinician,
    deletePortalClinician,
    getPortalClinicianCounts,
    getPortalPlanPatientAssessments,
    getAllAssessmentInfos,
    getAllSubscriptions,
    getAllSubscriptionsMonthWise,
    getDoctorPlanSubscriptions,
    getDoctorPlanSubscriptionsMonthWise,
    getPortalSubscriptionsMonthWise,
    getDoctorPlanSubscriptionsWithDetails,
    calculateTotalEarnings,
    getSubscriptionCountsMonthWise,
    getDetailedSubscriptionCountsMonthWise
 } = require('../controllers/adminController');
const {createPortalPlan, createPlan} = require('../controllers/planController');
require('../config/passport');

router.post('/register', registerAdmin);
router.post('/login', loginAdmin);

router.get('/get-patients', adminAuth, getPatients);
router.get('/get-doctors', adminAuth, getDoctors);
router.put('/verify-doctor/:id', adminAuth, verifyDoctor);

router.patch('/update-name', adminAuth, updateAdminName);
router.patch('/update-password', adminAuth, updateAdminPassword);
router.post('/portal-plan', adminAuth, createPortalPlan);

router.get('/organizations', adminAuth, getAllOrganizations);
router.get('/organization-stats', adminAuth, getOrganizationStats);

router.route('/create-plan').post(adminAuth, createPortalPlan);
router.route('/create-doctor-plan').post(adminAuth, createPlan);

router.get('/portal-plans', adminAuth, getPortalPlans);
router.get('/portal-plans/:id', adminAuth, getPortalPlanById);
router.put('/portal-plans/:id', adminAuth, updatePortalPlan);
router.delete('/portal-plans/:id', adminAuth, deletePortalPlan);

router.get('/subscriptions', adminAuth, getPortalPlanSubscriptions);
router.get('/subscription-counts', adminAuth, getPortalPlanSubscriptionCounts);
router.get('/earnings', adminAuth, getPortalPlanEarnings);
router.get('/current-earnings', adminAuth, getPortalPlanEarningsSummary);

// Portal Clinician Management Routes
router.get('/doctors', adminAuth, getPortalClinicians);
router.put('/doctors/:id', adminAuth, updatePortalClinician);
router.delete('/doctors/:id', adminAuth, deletePortalClinician);
router.get('/doctors-counts', adminAuth, getPortalClinicianCounts);

router.get('/patient-assessments', adminAuth, getPortalPlanPatientAssessments);
router.get('/all-assessments', adminAuth, getAllAssessmentInfos);

router.get('/all-subscriptions', adminAuth, getAllSubscriptions);
router.get('/all-subscriptions-month-wise', adminAuth, getAllSubscriptionsMonthWise);
router.get('/doctor-plan-subscriptions', adminAuth, getDoctorPlanSubscriptions);
router.get('/doctor-plan-subscriptions-month-wise', adminAuth, getDoctorPlanSubscriptionsMonthWise);
router.get('/portal-subscriptions-month-wise', adminAuth, getPortalSubscriptionsMonthWise);
router.get('/doctor-plan-subscriptions-with-details', adminAuth, getDoctorPlanSubscriptionsWithDetails);
router.get('/total-earnings', adminAuth, calculateTotalEarnings);
router.get('/subscription-counts-month-wise', adminAuth, getSubscriptionCountsMonthWise);
router.get('/detailed-subscription-counts-month-wise', adminAuth, getDetailedSubscriptionCountsMonthWise);
module.exports = router;