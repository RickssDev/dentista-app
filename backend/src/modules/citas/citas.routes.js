const express = require("express");
const router = express.Router();
const controller = require("./citas.controller");
const { verifyToken } = require("../../middlewares/verifyToken");
const { authorizeRoles } = require("../../middlewares/authorizeRoles");

router.get("/estado/:estado", verifyToken, authorizeRoles('Administrador', 'Asistente'), controller.getCitasByEstado);
router.get("/filtro/:tipo", verifyToken, authorizeRoles('Administrador', 'Asistente'), controller.getCitasPorPeriodo);

router.get("/paciente/:id_paciente", verifyToken, controller.getCitasByPaciente);
router.get("/miscitas", verifyToken, controller.getMisCitas);
router.get("/proximacita", verifyToken, controller.getProximaCita);
router.get("/horarios-disponibles", verifyToken, controller.getHorariosDisponibles);

router.post("/paciente", verifyToken, controller.createCitaPaciente);
router.post("/", verifyToken, authorizeRoles('Administrador', 'Asistente'), controller.createCita);

router.patch("/:id/cancelar", verifyToken, controller.cancelarCita);
router.put("/:id", verifyToken, controller.updateCita);
router.delete("/:id", verifyToken, controller.deleteCita);

router.get("/", verifyToken, authorizeRoles('Administrador', 'Asistente'), controller.getCitas);
router.get("/:id", verifyToken, authorizeRoles('Administrador', 'Asistente'), controller.getCitaById);

module.exports = router;