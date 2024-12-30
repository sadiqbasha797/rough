const express = require('express');
const router = express.Router();
const {adminAuth} = require('../middleware/adminAuth');
const {assistantAuth} = require('../middleware/assistantAuth');
const { 
    updateAdminName, 
    updateAdminPassword,
    getAllOrganizations,
    getOrganizationById,
    updateOrganization,
    deleteOrganization,
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
    getDetailedSubscriptionCountsMonthWise,
    getTotalSubscriptionCounts,
    getDetailedEarningsMonthWise,
    updateAdminInfo,
    updateAdminMedia,
    getAdminProfile,
    getAdminNotifications,
    getAssistants,
    updateAssistant,
    deleteAssistant,
    getNonVerifiedClinicians
 } = require('../controllers/adminController');
const {createPortalPlan, createPlan,getDoctorPlans,updatePlan,getPlanById} = require('../controllers/planController');
const {updateAssistantPermissions, getAssistantPermissions} = require('../controllers/assistantController');
const {getClinisistById} = require('../controllers/clinisistController');
const fileUpload = require('express-fileupload');
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
router.get('/organization/:id', adminAuth, getOrganizationById);
router.put('/organization/:id', adminAuth, updateOrganization);
router.delete('/organization/:id', adminAuth, deleteOrganization);

router.route('/create-plan').post(adminAuth, createPortalPlan);
router.route('/create-doctor-plan').post(adminAuth, createPlan);
router.route('/list-doctor-plans').get(adminAuth,getDoctorPlans);
router.route('/update-plan/:id').put(adminAuth,updatePlan);
router.route('/get-plan/:id').get(adminAuth,getPlanById);
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
router.get('/doctors/:id', adminAuth, getClinisistById);

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
router.get('/total-subscription-counts', adminAuth, getTotalSubscriptionCounts);
router.get('/detailed-earnings-month-wise', adminAuth, getDetailedEarningsMonthWise);

router.put('/update-info', adminAuth, updateAdminInfo);
router.patch('/update-media', adminAuth, fileUpload(), updateAdminMedia);

router.get('/profile', adminAuth, getAdminProfile);
router.get('/notifications', adminAuth, getAdminNotifications);
router.get('/notifications-assistant', assistantAuth, getAdminNotifications);

// Assistant Management Routes
router.get('/assistants', adminAuth, getAssistants);
router.put('/assistants/:assistantId', adminAuth, updateAssistant);
router.delete('/assistants/:assistantId', adminAuth, deleteAssistant);
router.put('/assistants/permissions/:assistantId', adminAuth, updateAssistantPermissions);
router.get('/assistants/permissions/:assistantId', adminAuth, getAssistantPermissions);

router.get('/non-verified-clinicians', adminAuth, getNonVerifiedClinicians);

module.exports = router;