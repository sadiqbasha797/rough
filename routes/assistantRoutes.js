const express = require('express');
const router = express.Router();
const { assistantAuth } = require('../middleware/assistantAuth');
const fileUpload = require('express-fileupload');
const {
    registerAssistant,
    loginAssistant,
    getAssistantProfile,
    updateAssistantName,
    updateAssistantPassword,
    updateAssistantInfo,
    updateAssistantMedia,
    deleteAssistant,
    getAssistantCounts,
} = require('../controllers/assistantController');
    const {
        getAllOrganizations,
        getOrganizationStats,
        getPatients,
        getDoctors,
        verifyDoctor,
        getPortalPlans,
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
        getDetailedSubscriptionCountsMonthWise,
        getTotalSubscriptionCounts,
        getDetailedEarningsMonthWise,
        getNonVerifiedClinicians,
    } = require('../controllers/adminController');
const {updateAssistantPermissions, getAssistantPermissions} = require('../controllers/assistantController');
const {getClinisistById} = require('../controllers/clinisistController');
const {getDoctorPlans,updatePlan,getPlanById} = require('../controllers/planController');  
// Public routes
router.post('/register', registerAssistant);
router.post('/login', loginAssistant);

// Protected routes
router.get('/profile', assistantAuth, getAssistantProfile);
router.patch('/update-name', assistantAuth, updateAssistantName);
router.patch('/update-password', assistantAuth, updateAssistantPassword);
router.patch('/update-info', assistantAuth, updateAssistantInfo);
router.patch('/update-media', assistantAuth, fileUpload(), updateAssistantMedia);
router.delete('/delete', assistantAuth, deleteAssistant);
router.get('/counts', assistantAuth, getAssistantCounts);

router.get('/get-patients', assistantAuth, getPatients);
router.get('/get-doctors', assistantAuth, getDoctors);
router.put('/verify-doctor/:id', assistantAuth, verifyDoctor);

router.get('/organizations', assistantAuth, getAllOrganizations);
router.get('/organization-stats', assistantAuth, getOrganizationStats);

router.get('/portal-plans', assistantAuth, getPortalPlans);
router.get('/portal-plans/:id', assistantAuth, getPortalPlanById);
router.put('/portal-plans/:id', assistantAuth, updatePortalPlan);
router.delete('/portal-plans/:id', assistantAuth, deletePortalPlan);

router.get('/subscriptions', assistantAuth, getPortalPlanSubscriptions);
router.get('/subscription-counts', assistantAuth, getPortalPlanSubscriptionCounts);
router.get('/earnings', assistantAuth, getPortalPlanEarnings);
router.get('/current-earnings', assistantAuth, getPortalPlanEarningsSummary);

// Portal Clinician Management Routes
router.get('/doctors', assistantAuth, getPortalClinicians);
router.put('/doctors/:id', assistantAuth, updatePortalClinician);
router.delete('/doctors/:id', assistantAuth, deletePortalClinician);
router.get('/doctors-counts', assistantAuth, getPortalClinicianCounts);
router.get('/doctors/:id', assistantAuth, getClinisistById);

router.get('/patient-assessments', assistantAuth, getPortalPlanPatientAssessments);
router.get('/all-assessments', assistantAuth, getAllAssessmentInfos);

router.get('/all-subscriptions', assistantAuth, getAllSubscriptions);
router.get('/all-subscriptions-month-wise', assistantAuth, getAllSubscriptionsMonthWise);
router.get('/doctor-plan-subscriptions', assistantAuth, getDoctorPlanSubscriptions);
router.get('/doctor-plan-subscriptions-month-wise', assistantAuth, getDoctorPlanSubscriptionsMonthWise);
router.get('/portal-subscriptions-month-wise', assistantAuth, getPortalSubscriptionsMonthWise);
router.get('/doctor-plan-subscriptions-with-details', assistantAuth, getDoctorPlanSubscriptionsWithDetails);
router.get('/total-earnings', assistantAuth, calculateTotalEarnings);

router.get('/subscription-counts-month-wise', assistantAuth, getSubscriptionCountsMonthWise);
router.get('/detailed-subscription-counts-month-wise', assistantAuth, getDetailedSubscriptionCountsMonthWise);
router.get('/total-subscription-counts', assistantAuth, getTotalSubscriptionCounts);
router.get('/detailed-earnings-month-wise', assistantAuth, getDetailedEarningsMonthWise);

router.get('/get-permissions/:assistantId',  getAssistantPermissions);

router.get('/list-doctor-plans',assistantAuth, getDoctorPlans);
router.put('/update-plan/:id', assistantAuth, updatePlan);
router.get('/get-plan/:id', assistantAuth, getPlanById);
router.get('/non-verified-clinicians', assistantAuth, getNonVerifiedClinicians);
module.exports = router; 