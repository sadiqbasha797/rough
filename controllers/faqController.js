const FAQ = require('../models/faq');

const faqController = {
  // Get all FAQs
  getAllFaqs: async (req, res) => {
    try {
      const faqs = await FAQ.find({ isActive: true }).sort({ order: 1, category: 1 });
      res.json({
        status: 'success',
        body: faqs,
        message: 'FAQs retrieved successfully'
      });
    } catch (error) {
      res.json({
        status: 'error',
        body: null,
        message: error.message
      });
    }
  },

  // Get FAQ by ID
  getFaqById: async (req, res) => {
    try {
      const faq = await FAQ.findById(req.params.id);
      if (!faq) {
        return res.json({
          status: 'error',
          body: null,
          message: 'FAQ not found'
        });
      }
      res.json({
        status: 'success',
        body: faq,
        message: 'FAQ retrieved successfully'
      });
    } catch (error) {
      res.json({
        status: 'error',
        body: null,
        message: error.message
      });
    }
  },

  // Create new FAQ
  createFaq: async (req, res) => {
    const faq = new FAQ({
      question: req.body.question,
      answer: req.body.answer,
      category: req.body.category,
      order: req.body.order,
      isActive: req.body.isActive
    });

    try {
      const newFaq = await faq.save();
      res.status(201).json({
        status: 'success',
        body: newFaq,
        message: 'FAQ created successfully'
      });
    } catch (error) {
      res.json({
        status: 'error',
        body: null,
        message: error.message
      });
    }
  },

  // Update FAQ
  updateFaq: async (req, res) => {
    try {
      const faq = await FAQ.findById(req.params.id);
      if (!faq) {
        return res.json({
          status: 'error',
          body: null,
          message: 'FAQ not found'
        });
      }

      Object.assign(faq, req.body);
      const updatedFaq = await faq.save();
      res.json({
        status: 'success',
        body: updatedFaq,
        message: 'FAQ updated successfully'
      });
    } catch (error) {
      res.json({
        status: 'error',
        body: null,
        message: error.message
      });
    }
  },

  // Delete FAQ
  deleteFaq: async (req, res) => {
    try {
      const faq = await FAQ.findById(req.params.id);
      if (!faq) {
        return res.json({
          status: 'error',
          body: null,
          message: 'FAQ not found'
        });
      }

      await faq.deleteOne();
      res.json({
        status: 'success',
        body: null,
        message: 'FAQ deleted successfully'
      });
    } catch (error) {
      res.json({
        status: 'error',
        body: null,
        message: error.message
      });
    }
  }
};

module.exports = faqController;