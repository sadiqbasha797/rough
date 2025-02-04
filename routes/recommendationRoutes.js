const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/adminAuth');
const { patientProtect } = require('../middleware/auth');
const { clincistProtect } = require('../middleware/auth'); // Middleware to protect routes
const {
    getDoctorRecommendations,
    getPortalRecommendations,
    createRecommendation,
    getRecommendations,
    getRecommendationById,
    updateRecommendation,
    deleteRecommendation,
    createDoctorRecommendation,
    getRecommendationsForSubscribedPatient,
    getPortalRecommendationsForPatient,
    deleteMedia,
    getPortalRecommendationsByRecommendedTo
} = require('../controllers/recommendationController');

// Routes
router.post('/create-rec',adminAuth,  createRecommendation);
router.post('/create-doctor-rec', clincistProtect, createDoctorRecommendation);
router.get('/recommendations', getRecommendations);
router.get('/recommendations/:id', getRecommendationById);
router.put('/recommendations/:id',  updateRecommendation);
router.delete('/recommendations/:id',  deleteRecommendation);
router.get('/doctor_recommendations',patientProtect, getDoctorRecommendations);
router.get('/portal_recommendations',patientProtect, getPortalRecommendations);
router.delete('/recommendations/:recommendationId/media/:mediaType/:mediaId', deleteMedia);
router.get('/recommendations-for-subscribed-patient/:patientId', clincistProtect, getRecommendationsForSubscribedPatient);
router.get('/portal-recommendations-for-patient/:patientId', getPortalRecommendationsForPatient);
router.get('/recommended-to/:recommendedTo', getPortalRecommendationsByRecommendedTo);
module.exports = router;
