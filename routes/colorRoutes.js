const express = require('express');
const {adminAuth} = require('../middleware/adminAuth');
const {
    createMood,
    getAllMoods,
    getMoodById,
    updateMood,
    deleteMood
} = require('../controllers/colorController');

const router = express.Router();

router.post('/add-mood', adminAuth, createMood);
router.get('/moods',  getAllMoods);
router.get('/moods/:id',  getMoodById);
router.put('/moods/:id',  updateMood);
router.delete('/moods/:id', adminAuth, deleteMood);

module.exports = router;
