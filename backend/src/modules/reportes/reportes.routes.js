const express = require("express");
const router = express.Router();
const controller = require("./reportes.controller");
const { verifyToken } = require("../../middlewares/verifyToken");
const { authorizeRoles } = require("../../middlewares/authorizeRoles");

router.get("/citas", verifyToken, authorizeRoles("Administrador", "Asistente"), controller.getReporteCitas);
router.get("/citas/exportar/excel", verifyToken, authorizeRoles("Administrador", "Asistente"), controller.exportarExcel);
router.get("/citas/exportar/pdf", verifyToken, authorizeRoles("Administrador", "Asistente"), controller.exportarPdf);
router.get(
  "/pacientes",
  verifyToken,
  authorizeRoles("Administrador", "Asistente"),
  controller.getReportePacientes,
);

router.get(
  "/pacientes/exportar/excel",
  verifyToken,
  authorizeRoles("Administrador", "Asistente"),
  controller.exportarPacientesExcel,
);

router.get(
  "/pacientes/exportar/pdf",
  verifyToken,
  authorizeRoles("Administrador", "Asistente"),
  controller.exportarPacientesPdf,
);

module.exports = router;