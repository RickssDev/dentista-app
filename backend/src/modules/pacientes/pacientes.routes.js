const express = require('express');
const controller = require('./pacientes.controller');
const { verifyToken } = require("../../middlewares/verifyToken");

const router = express.Router();

router.post('/', verifyToken, controller.createPaciente);
router.get('/', controller.getPacientesSelect);

router.get('/perfil', verifyToken, controller.getPerfil);

router.put('/perfil', verifyToken, controller.updatePerfil);

router.get('/:idUsuario', controller.getPacienteByUserId);



module.exports = router;