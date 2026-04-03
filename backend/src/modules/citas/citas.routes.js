const express = require("express");
const router = express.Router();
const controller = require("./citas.controller");

router.get('/estado/:estado', controller.getCitasByEstado);
router.get('/filtro/:tipo', controller.getCitasPorPeriodo);
router.get('/paciente/:id_paciente', controller.getCitasByPaciente);
router.get('/miscitas/:idPaciente', controller.getMisCitas);

router.post('/paciente', controller.createCitaPaciente);
router.post('/', controller.createCita);

router.patch('/:id/cancelar', controller.cancelarCita);
router.put('/:id', controller.updateCita);
router.delete('/:id', controller.deleteCita);

router.get('/', controller.getCitas);
router.get('/:id', controller.getCitaById);



module.exports = router;
