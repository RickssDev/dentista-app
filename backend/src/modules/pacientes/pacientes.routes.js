const express = require("express");
const controller = require("./pacientes.controller");
const { verifyToken } = require("../../middlewares/verifyToken");
const { authorizeRoles } = require("../../middlewares/authorizeRoles");

const router = express.Router();

router.post("/", verifyToken, controller.createPaciente);
router.get("/", verifyToken, authorizeRoles("Administrador", "Asistente"), controller.getPacientesSelect);

router.get("/perfil", verifyToken, controller.getPerfil);

router.put("/perfil", verifyToken, controller.updatePerfil);

router.get("/:idUsuario", verifyToken, authorizeRoles("Administrador", "Asistente"), controller.getPacienteByUserId);

module.exports = router;
