const express = require('express');
const controller = require('./pacientes.controller');

const router = express.Router();

router.get('/:idUsuario', controller.getPacienteByUserId);
router.post('/', controller.createPaciente);
router.get('/perfil/:idUsuario', controller.getPerfil);
router.put('/perfil/:idUsuario', controller.updatePerfil);


module.exports = router;