const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const multer = require('multer');
const upload = multer();

router.post('/', upload.single('media'), announcementController.createAnnouncement);
router.get('/', announcementController.getAnnouncements);
router.put('/:id', upload.single('media'), announcementController.updateAnnouncement);
router.delete('/:id', announcementController.deleteAnnouncement);
router.get('/:id', announcementController.getAnnouncementById);
module.exports = router; 