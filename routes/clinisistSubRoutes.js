const express = require('express');
const router = express.Router();
const {
    createClinicianSubscription,
    getAllClinicianSubscriptions,
    getClinicianSubscription,
    updateClinicianSubscription,
    deleteClinicianSubscription,
    manualCheckExpiredSubscriptions,
    checkAndUpdateExpiredSubscriptions,
    getClinicianSubscriptionCounts,
    getMonthlyClinicianSubscriptionStats,
    getClinicianSubscriptions,
    checkClinicianPreviousSubscription
   } = require('../controllers/clinicianSubscriptionController');
const { clincistProtect } = require('../middleware/auth'); // Middleware to protect routes
router.post('/create/:id', clincistProtect, createClinicianSubscription);
router.get('/getAll', getAllClinicianSubscriptions);
router.get('/get/:id', getClinicianSubscription);
router.put('/update/:id', updateClinicianSubscription);
router.delete('/delete/:id', deleteClinicianSubscription);
router.post('/check-expired', manualCheckExpiredSubscriptions);
router.post('/check-and-update-expired', checkAndUpdateExpiredSubscriptions);
router.get('/counts', getClinicianSubscriptionCounts);
router.get('/monthly-stats', getMonthlyClinicianSubscriptionStats);
router.get('/clinician-subscriptions',clincistProtect, getClinicianSubscriptions);
router.get('/check-previous-subscription', clincistProtect, checkClinicianPreviousSubscription);
module.exports = router;

