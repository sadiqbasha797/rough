const express = require('express');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const { 
    registerOrganization, 
    loginOrganization, 
    getOrganization,
    getClinisistsByOrganization,
    getActiveClinisistsByOrganization,
    getInactiveClinisistsByOrganization, 
    getClinisistCountByOrganization,
    getCreatedByClinisist,
    createOrganizationPlan,
    getOrganizationPlans,
    getOrganizationPlanById,
    updateOrganizationPlan,
    deleteOrganizationPlan,
    getOrganizationPatients,
    getOrganizationSubscriptionCounts,
    getOrganizationSubscriptions,
    getOrganizationEarnings,
    updateOrgAdmin,
    updateManager,
    deleteOrgAdmin,
    deleteManager,
    getNotifications,
    updateOrganizationImage,
    updateOrganizationData,
    updateOrganizationCertificate
 } = require('../controllers/organizationController');

 const {
    getActiveOrgAdminsByOrganization, 
    getInactiveOrgAdminsByOrganization ,
    getOrgAdminCounts,
    getOrgAdminsByOrganization
} = require('../controllers/orgAdminController');

 const {
    getAllManagersByOrganization, 
    getActiveManagersByOrganization, 
    getInactiveManagersByOrganization, 
    getManagersCountByOrganization 
 } = require('../controllers/managerController');

 const {authenticateOrgAdmin, authOrganization} = require('../middleware/auth');
 const router = express.Router();
router.post('/register', registerOrganization);
router.post('/login', loginOrganization);
router.get('/me', authOrganization, getOrganization);
router.get('/doctors',authOrganization, getClinisistsByOrganization);
router.get('/doctors/active',authOrganization, getActiveClinisistsByOrganization);
router.get('/doctors/inactive',authOrganization, getInactiveClinisistsByOrganization);
router.get('/doctors/count',authOrganization, getClinisistCountByOrganization);
router.get('/my-doctors',authOrganization, getCreatedByClinisist);
router.get('/orgadmins',authOrganization, getOrgAdminsByOrganization); 
router.get('/orgadmins/counts',authOrganization, getOrgAdminCounts); 
router.get('/orgadmins/active',authOrganization, getActiveOrgAdminsByOrganization);  
router.get('/orgadmins/inactive',authOrganization, getInactiveOrgAdminsByOrganization);  
router.get('/managers',authOrganization, getAllManagersByOrganization);  
router.get('/managers/active',authOrganization, getActiveManagersByOrganization);  
router.get('/managers/inactive',authOrganization, getInactiveManagersByOrganization);  
router.get('/managers/counts',authOrganization, getManagersCountByOrganization);
router.post('/create-plan', authOrganization, createOrganizationPlan);
router.get('/plans', authOrganization, getOrganizationPlans);
router.get('/plan/:planId', authOrganization, getOrganizationPlanById);
router.put('/plan/:planId', authOrganization, updateOrganizationPlan);
router.delete('/plan/:planId', authOrganization, deleteOrganizationPlan);
router.get('/patients', authOrganization, getOrganizationPatients);
router.get('/subscription-counts', authOrganization, getOrganizationSubscriptionCounts);
router.get('/subscriptions', authOrganization, getOrganizationSubscriptions);
router.get('/earnings', authOrganization, getOrganizationEarnings);
router.put('/orgadmin/:orgAdminId', authOrganization, updateOrgAdmin);
router.put('/manager/:managerId', authOrganization, updateManager);
router.delete('/orgadmin/:orgAdminId', authOrganization, deleteOrgAdmin);
router.delete('/manager/:managerId', authOrganization, deleteManager);
router.get('/notifications', authOrganization, getNotifications);
router.put('/update-image', authOrganization, upload.single('image'), updateOrganizationImage);
router.put('/update-data', authOrganization, updateOrganizationData);
router.put('/update-certificate', authOrganization, upload.single('certificate'), updateOrganizationCertificate);
router.get('/check-previous-subscription', authOrganization, require('../controllers/orgSubscription').checkOrganizationPreviousSubscription);
module.exports = router;
