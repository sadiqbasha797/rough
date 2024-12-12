const express = require('express');
const router = express.Router();
const {authenticateManager, authOrganization} = require('../middleware/auth');

const {
    registerManager,
    loginManager,
    getManagerDetails,
    updateManager,
    deleteManager,
    getManagerById,
    getClinisistsCreatedByManager,
    getClinisistCountsByManager,
    getSubscriptionsOfClinisistsJoinedByManager,
    getSubscriptionCountsByManager,
    getSubscriptionBudgetByManager,
    getManagerEarnings,
    getNotifications,
    getSubscribedPatientsOfClinicians,
    getManagerAndOrganizationInfo
} = require('../controllers/managerController');

router.post('/login', loginManager);
router.get('/me', authenticateManager, getManagerDetails);
router.put('/me', authenticateManager, updateManager);
router.delete('/me', authenticateManager, deleteManager);
router.get('/clinicians-created', authenticateManager, getClinisistsCreatedByManager);
router.get('/clinicians-counts', authenticateManager, getClinisistCountsByManager);
router.get('/subscriptions', authenticateManager, getSubscriptionsOfClinisistsJoinedByManager);
router.get('/subscriptions-counts', authenticateManager, getSubscriptionCountsByManager);
router.get('/earnings', authenticateManager, getSubscriptionBudgetByManager);
router.get('/earnings-count', authenticateManager, getManagerEarnings);
router.get('/notifications', authenticateManager, getNotifications);
router.get('/subscribed-patients', authenticateManager, getSubscribedPatientsOfClinicians);
router.get('/info', authenticateManager, getManagerAndOrganizationInfo);

router.post('/register',authOrganization, registerManager);
router.get('/:id', authOrganization, getManagerById);
module.exports = router;
