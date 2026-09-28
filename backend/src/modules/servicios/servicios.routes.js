const express = require('express');
const router = express.Router();
const controller = require('./servicios.controller');
const upload = require('../../utils/upload');
const { verifyToken } = require("../../middlewares/verifyToken");
const { authorizeRoles } = require("../../middlewares/authorizeRoles");

router.get('/', verifyToken, authorizeRoles("Administrador", "Asistente"), controller.getServicios);
router.get('/publicos', controller.getServiciosPublicos);
router.get('/:id', verifyToken, authorizeRoles("Administrador", "Asistente"), controller.getServicioById);

router.post('/', verifyToken, authorizeRoles("Administrador", "Asistente"), upload.single('imagen'), controller.createServicio);
router.put('/:id', verifyToken, authorizeRoles("Administrador", "Asistente"), upload.single('imagen'), controller.updateServicio);
router.delete('/:id', verifyToken, authorizeRoles("Administrador", "Asistente"), controller.deleteServicio);

module.exports = router;