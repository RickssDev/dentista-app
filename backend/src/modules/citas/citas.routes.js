const express = require("express");
const router = express.Router();
const controller = require("./citas.controller");
const { verifyToken } = require("../../middlewares/verifyToken");
const { authorizeRoles } = require("../../middlewares/authorizeRoles");

const personal = authorizeRoles("Administrador", "Asistente");

// ===== Solo personal de la clínica =====
router.get("/estado/:estado", verifyToken, personal, controller.getCitasByEstado);
router.get("/filtro/:tipo", verifyToken, personal, controller.getCitasPorPeriodo);
router.get("/paciente/:id_paciente", verifyToken, personal, controller.getCitasByPaciente);

// ===== Paciente: solo sus propias citas =====
router.get("/miscitas", verifyToken, controller.getMisCitas);
router.get("/proximacita", verifyToken, controller.getProximaCita);
router.get("/horarios-disponibles", verifyToken, controller.getHorariosDisponibles);

router.post("/paciente", verifyToken, controller.createCitaPaciente);
router.put("/mias/:id", verifyToken, controller.updateMiCita);
router.patch("/mias/:id/cancelar", verifyToken, controller.cancelarMiCita);

// ===== Solo personal de la clínica =====
router.post("/", verifyToken, personal, controller.createCita);
router.patch("/:id/cancelar", verifyToken, personal, controller.cancelarCita);
router.put("/:id", verifyToken, personal, controller.updateCita);
// Las citas no se eliminan: se cancelan, y así se conserva el historial

router.get("/", verifyToken, personal, controller.getCitas);
router.get("/:id", verifyToken, personal, controller.getCitaById);

module.exports = router;