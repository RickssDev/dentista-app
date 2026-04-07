const express = require('express');
const router = express.Router();
const controller = require('./historial.controller');

router.post(
  '/finalizar-cita/:idCita',
  controller.crearDesdeCita
);
router.get(
  '/cita/:idCita',
  controller.obtenerDatosFormulario
);
router.get(
  '/',
  controller.getHistoriales
);
module.exports = router;