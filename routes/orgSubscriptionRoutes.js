const express = require('express');
const router = express.Router();
const {adminAuth} = require('../middleware/adminAuth');
const {
    createOrgSubscription,
    getAllOrgSubscriptions,
    getOrgSubscription,
    updateOrgSubscription,
    deleteOrgSubscription,
    manualCheckExpiredSubscriptions
} = require('../controllers/orgSubscription');

router.post('/create', adminAuth, createOrgSubscription);
router.get('/getAll', adminAuth, getAllOrgSubscriptions);
router.get('/get/:id', adminAuth, getOrgSubscription);
router.put('/update/:id', adminAuth, updateOrgSubscription);
router.delete('/delete/:id', adminAuth, deleteOrgSubscription);
router.get('/checkExpired', adminAuth, manualCheckExpiredSubscriptions);
module.exports = router;    