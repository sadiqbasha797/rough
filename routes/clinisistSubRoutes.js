const express = require('express');
const router = express.Router();
const {
    createClinicianSubscription,
    getAllClinicianSubscriptions,
    getClinicianSubscription,
    updateClinicianSubscription,
    deleteClinicianSubscription,
    manualCheckExpiredSubscriptions     
   } = require('../controllers/clinicianSubscriptionController');

router.post('/create', createClinicianSubscription);
router.get('/getAll', getAllClinicianSubscriptions);
router.get('/get/:id', getClinicianSubscription);
router.put('update/:id', updateClinicianSubscription);
router.delete('delete/:id', deleteClinicianSubscription);
router.post('check-expired', manualCheckExpiredSubscriptions);

module.exports = router;

