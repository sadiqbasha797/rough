const express = require('express');
const forgotPassword = require('../controllers/forgotPassword');
const resetPassword = require('../controllers/resetPassword');
const OrgAdmin = require('../models/orgAdmin'); // Change this for different models
const Manager = require('../models/manager');   // Change this for different models
const Organization = require('../models/organization'); // Change this for different models
const Admin = require('../models/admin');   
const Assistant = require('../models/assistant');

const router = express.Router();

// Example routes for OrgAdmin
router.post('/orgadmin/forgot-password', (req, res) => forgotPassword(req, res, OrgAdmin));
router.post('/orgadmin/reset-password', (req, res) => resetPassword(req, res, OrgAdmin));

// Example routes for Manager
router.post('/manager/forgot-password', (req, res) => forgotPassword(req, res, Manager));
router.post('/manager/reset-password', (req, res) => resetPassword(req, res, Manager));

// Example routes for Organization
router.post('/organization/forgot-password', (req, res) => forgotPassword(req, res, Organization));
router.post('/organization/reset-password', (req, res) => resetPassword(req, res, Organization));

// Example routes for Admin
router.post('/admin/forgot-password', (req, res) => forgotPassword(req, res, Admin));
router.post('/admin/reset-password', (req, res) => resetPassword(req, res, Admin));

// Example routes for Assistant
router.post('/assistant/forgot-password', (req, res) => forgotPassword(req, res, Assistant));
router.post('/assistant/reset-password', (req, res) => resetPassword(req, res, Assistant));

module.exports = router;
