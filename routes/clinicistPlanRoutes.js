const express = require('express');
const router = express.Router();
const {
    createClinicistPlan,
    getAllClinicistPlans,
    getClinicistPlanById,
    updateClinicistPlan,
    deleteClinicistPlan,
    getActiveClinicistPlans
} = require('../controllers/clinicistPlanController');

router.post('/', createClinicistPlan);
router.get('/', getAllClinicistPlans);
router.get('/active', getActiveClinicistPlans);  // New route for active plans
router.get('/:id', getClinicistPlanById);
router.put('/:id', updateClinicistPlan);
router.delete('/:id', deleteClinicistPlan);

module.exports = router;
