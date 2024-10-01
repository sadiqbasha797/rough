const express = require('express');
const router = express.Router();
const multer = require('multer');
const { 
    authOrganization, authenticateOrgAdmin, authenticateManager 
} = require('../middleware/auth');
const { 
    registerClinisistOrganization, 
    registerClinisistOrgAdmin, 
    registerClinisistManager,
    updateClinisistOrganization,
    updateClinisistOrgAdmin,
    updateClinisistManager,
    deleteClinisistOrganization,
    deleteClinisistOrgAdmin,
    deleteClinisistManager,
} = require('../controllers/orgClinisistController');

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Existing routes
router.post('/organization/register-doctor', authOrganization, registerClinisistOrganization);
router.post('/orgadmin/register-doctor', authenticateOrgAdmin, registerClinisistOrgAdmin);
router.post('/manager/register-doctor', authenticateManager, registerClinisistManager);

// Updated routes for updating Clinisists with image upload
router.put('/organization/update-doctor/:clinisistId', authOrganization, upload.single('image'), updateClinisistOrganization);
router.put('/orgadmin/update-doctor/:clinisistId', authenticateOrgAdmin, upload.single('image'), updateClinisistOrgAdmin);
router.put('/manager/update-doctor/:clinisistId', authenticateManager, upload.single('image'), updateClinisistManager);

router.delete('/organization/delete-doctor/:clinisistId', authOrganization, deleteClinisistOrganization);
router.delete('/orgadmin/delete-doctor/:clinisistId', authenticateOrgAdmin, deleteClinisistOrgAdmin);
router.delete('/manager/delete-doctor/:clinisistId', authenticateManager, deleteClinisistManager);

module.exports = router;
