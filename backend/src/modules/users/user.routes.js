const express = require('express');
const router = express.Router();
const controller = require('./user.controller');
const upload = require('../../utils/upload');
const { verifyToken } = require("../../middlewares/verifyToken");
const { authorizeRoles } = require("../../middlewares/authorizeRoles");

router.get('/', verifyToken, authorizeRoles("Administrador"), controller.getUsuarios);
router.get('/:id', verifyToken, authorizeRoles("Administrador"), controller.getUsuarioById);
router.post('/', verifyToken, authorizeRoles("Administrador"), upload.single('imagen'), controller.createUsuario);
router.put('/:id', verifyToken, authorizeRoles("Administrador"), upload.single('imagen'), controller.updateUsuario);
router.delete('/:id', verifyToken, authorizeRoles("Administrador"), controller.deleteUsuario);

module.exports = router;