const express = require('express');
const router = express.Router();
const {adminAuth} = require('../middleware/adminAuth');
const {
    createOrgSubscription,
    getAllOrgSubscriptions,
    getOrgSubscription,
    updateOrgSubscription,
    deleteOrgSubscription,
    manualCheckExpiredSubscriptions,
    getSubscriptionCounts
} = require('../controllers/orgSubscription');

router.post('/create',  createOrgSubscription);
router.get('/getAll', getAllOrgSubscriptions);
router.get('/get/:id',  getOrgSubscription);
router.put('/update/:id',  updateOrgSubscription);
router.delete('/delete/:id',  deleteOrgSubscription);
router.get('/checkExpired',  manualCheckExpiredSubscriptions);
router.get('/subscriptionCounts', getSubscriptionCounts);
module.exports = router;    