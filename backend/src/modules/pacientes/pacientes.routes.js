const express = require('express');
const controller = require('./pacientes.controller');

const router = express.Router();

router.post('/', controller.createPaciente);
router.get('/', controller.getPacientesSelect);

router.get('/perfil/:idUsuario', controller.getPerfil);
router.put('/perfil/:idUsuario', controller.updatePerfil);

router.get('/:idUsuario', controller.getPacienteByUserId);



module.exports = router;