const express = require('express');
const router = express.Router();
const { authOrganization, authenticateOrgAdmin, authenticateManager } = require('../middleware/auth');
const { registerClinisistOrganization, registerClinisistOrgAdmin, registerClinisistManager } = require('../controllers/orgClinisistController');

// Organization registers Clinisist
router.post('/organization/register-doctor', authOrganization, registerClinisistOrganization);

// OrgAdmin registers Clinisist
router.post('/orgadmin/register-doctor', authenticateOrgAdmin, registerClinisistOrgAdmin);

// Manager registers Clinisist
router.post('/manager/register-doctor', authenticateManager, registerClinisistManager);

module.exports = router;
