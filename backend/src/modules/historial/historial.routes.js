const express = require("express");
const router = express.Router();
const controller = require("./historial.controller");
const { verifyToken } = require("../../middlewares/verifyToken");
const { authorizeRoles } = require("../../middlewares/authorizeRoles");

router.post("/finalizar-cita/:idCita", verifyToken, authorizeRoles("Administrador", "Asistente"), controller.crearDesdeCita);
router.get("/cita/:idCita", verifyToken, authorizeRoles("Administrador", "Asistente"), controller.obtenerDatosFormulario);
router.get("/", verifyToken, authorizeRoles("Administrador", "Asistente"), controller.getHistoriales);
router.patch("/:idHistorial", verifyToken, authorizeRoles("Administrador", "Asistente"), controller.actualizarHistorial);
router.get("/paciente/:idPaciente", verifyToken, authorizeRoles("Administrador", "Asistente"), controller.getHistorialPaciente);
router.get("/:idHistorial", verifyToken, authorizeRoles("Administrador", "Asistente"), controller.getHistorialById);
module.exports = router;
