const express = require('express');
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
    getOrganizationPatients,
    getOrganizationSubscriptionCounts,
    getOrganizationSubscriptions,
    getOrganizationEarnings,
    updateOrgAdmin,
    updateManager,
    deleteOrgAdmin,
    deleteManager,
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
router.get('/orgadmins/active',authOrganization, getActiveOrgAdminsByOrganization);  // Get active org admins of a particular organization
router.get('/orgadmins/inactive',authOrganization, getInactiveOrgAdminsByOrganization);  // Get inactive org admins of a particular organization
router.get('/managers',authOrganization, getAllManagersByOrganization);  // Get all managers of a particular organization
router.get('/managers/active',authOrganization, getActiveManagersByOrganization);  // Get active managers of a particular organization
router.get('/managers/inactive',authOrganization, getInactiveManagersByOrganization);  // Get inactive managers of a particular organization
router.get('/managers/counts',authOrganization, getManagersCountByOrganization);  // Get counts of active, inactive, and total managers
router.post('/create-plan', authOrganization, createOrganizationPlan);
router.get('/patients', authOrganization, getOrganizationPatients);
router.get('/subscription-counts', authOrganization, getOrganizationSubscriptionCounts);
router.get('/subscriptions', authOrganization, getOrganizationSubscriptions);
router.get('/earnings', authOrganization, getOrganizationEarnings);
router.put('/orgadmin/:orgAdminId', authOrganization, updateOrgAdmin);
router.put('/manager/:managerId', authOrganization, updateManager);
router.delete('/orgadmin/:orgAdminId', authOrganization, deleteOrgAdmin);
router.delete('/manager/:managerId', authOrganization, deleteManager);

module.exports = router;
