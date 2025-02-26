const express = require('express');
const multer = require('multer');
const {uploadPatientImage, fetchPatientImage, deletePatientImage, updatePatientImage} = require('../controllers/patientMedia'); // Assuming your controller is named patientController
const router = express.Router();
const upload = multer(); // Setup multer for file uploads
const {patientProtect} = require('../middleware/auth')
router.post('/image',patientProtect , upload.single('image'), uploadPatientImage);
router.get('/image', patientProtect , fetchPatientImage);
router.delete('/image', patientProtect ,deletePatientImage);
router.put('/image', patientProtect, upload.single('image'), updatePatientImage);

module.exports = router;
