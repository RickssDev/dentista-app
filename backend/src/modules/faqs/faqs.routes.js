const express = require('express');
const router = express.Router();
const controller = require('./faqs.controller');
const { verifyToken } = require("../../middlewares/verifyToken");
const { authorizeRoles } = require("../../middlewares/authorizeRoles");

router.post('/', verifyToken, authorizeRoles("Administrador", "Asistente"), controller.createFaqs);
router.get('/', controller.getFaqs);
router.get('/:id', controller.getFaqsById);
router.put('/:id', verifyToken, authorizeRoles("Administrador", "Asistente"), controller.updateFaqs);
router.delete('/:id', verifyToken, authorizeRoles("Administrador", "Asistente"), controller.deleteFaqs);

module.exports = router;