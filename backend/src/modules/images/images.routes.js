const express = require('express');
const router = express.Router();
const controller = require('./images.controller');
const upload = require('../../utils/upload');
const { verifyToken } = require("../../middlewares/verifyToken");
const { authorizeRoles } = require("../../middlewares/authorizeRoles");
    
router.get('/', verifyToken, authorizeRoles("Administrador", "Asistente"), controller.getImagen);
router.get('/publicas', controller.getImagenesPublicas);
router.get('/:id', verifyToken, authorizeRoles("Administrador", "Asistente"), controller.getImagenById);

router.post('/', verifyToken, authorizeRoles("Administrador", "Asistente"),  upload.single('imagen'),   controller.createImagen);
router.put('/:id', verifyToken, authorizeRoles("Administrador", "Asistente"), upload.single('imagen'), controller.updateImagen);
router.delete('/:id', verifyToken, authorizeRoles("Administrador", "Asistente"), controller.deleteImagen);

module.exports = router;