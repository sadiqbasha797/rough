const express = require('express');
const router = express.Router();
const {authenticateOrgAdmin, authOrganization} = require('../middleware/auth');
const {
    registerOrgAdmin,
    loginOrgAdmin,
    getOrgAdminDetails,
    updateOrgAdmin,
    deleteOrgAdmin,
    getAllOrgAdminsByOrganization, 
    getActiveOrgAdminsByOrganization, 
    getInactiveOrgAdminsByOrganization ,
    getOrgAdminCounts,
    getOrgAdminsByOrganization
} = require('../controllers/orgAdminController');

router.post('/register',authOrganization, registerOrgAdmin);
router.post('/login', loginOrgAdmin);
router.get('/me', authenticateOrgAdmin, getOrgAdminDetails);
router.put('/update', authenticateOrgAdmin, updateOrgAdmin);
router.delete('/me', authenticateOrgAdmin, deleteOrgAdmin);

module.exports = router;
