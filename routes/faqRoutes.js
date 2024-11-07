const express = require('express');
const router = express.Router();
const faqController = require('../controllers/faqController');

// Get all FAQs
router.get('/', faqController.getAllFaqs);

// Get specific FAQ
router.get('/:id', faqController.getFaqById);

// Create new FAQ
router.post('/', faqController.createFaq);

// Update FAQ
router.put('/:id', faqController.updateFaq);

// Delete FAQ
router.delete('/:id', faqController.deleteFaq);

module.exports = router; 