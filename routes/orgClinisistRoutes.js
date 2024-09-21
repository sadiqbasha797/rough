const express = require('express');
const router = express.Router();
const { 
    authOrganization, authenticateOrgAdmin, authenticateManager } = require('../middleware/auth');
const { 
    registerClinisistOrganization, 
    registerClinisistOrgAdmin, 
    registerClinisistManager,
} = require('../controllers/orgClinisistController');
router.post('/organization/register-doctor', authOrganization, registerClinisistOrganization);
router.post('/orgadmin/register-doctor', authenticateOrgAdmin, registerClinisistOrgAdmin);
router.post('/manager/register-doctor', authenticateManager, registerClinisistManager);

module.exports = router;
