const express = require('express');
const router = express.Router();
const controller = require('./user.controller');
const upload = require('../../utils/upload');
const { verifyToken } = require("../../middlewares/verifyToken");
const { authorizeRoles } = require("../../middlewares/authorizeRoles");

router.get('/', verifyToken, authorizeRoles("Administrador", "Asistente"), controller.getUsuarios);
router.get('/:id', verifyToken, authorizeRoles("Administrador", "Asistente"), controller.getUsuarioById);
router.post('/', verifyToken, authorizeRoles("Administrador", "Asistente"), upload.single('imagen'), controller.createUsuario);
router.put('/:id', verifyToken, authorizeRoles("Administrador", "Asistente"), upload.single('imagen'), controller.updateUsuario);
router.delete('/:id', verifyToken, authorizeRoles("Administrador", "Asistente"), controller.deleteUsuario);

module.exports = router;