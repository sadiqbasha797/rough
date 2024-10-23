const express = require('express');
const router = express.Router();
const {
    createClinicistPlan,
    getAllClinicistPlans,
    getClinicistPlanById,
    updateClinicistPlan,
    deleteClinicistPlan
} = require('../controllers/clinicistPlanController');

router.post('/', createClinicistPlan);
router.get('/', getAllClinicistPlans);
router.get('/:id', getClinicistPlanById);
router.put('/:id', updateClinicistPlan);
router.delete('/:id', deleteClinicistPlan);

module.exports = router;
