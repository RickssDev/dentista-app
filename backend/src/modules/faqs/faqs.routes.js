const express = require('express');
const router = express.Router();
const controller = require('./faqs.controller');

router.post('/', controller.createFaqs);
router.get('/', controller.getFaqs);
router.get('/:id', controller.getFaqsById);
router.put('/:id', controller.updateFaqs);
router.delete('/:id', controller.deleteFaqs);

module.exports = router;