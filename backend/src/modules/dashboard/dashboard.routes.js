const express = require("express");
const router = express.Router();
const controller = require("./dashboard.controller");
const { verifyToken } = require("../../middlewares/verifyToken");
const { authorizeRoles } = require("../../middlewares/authorizeRoles");

router.get(
  "/resumen",
  verifyToken,
  authorizeRoles("Administrador", "Asistente"),
  controller.getResumen,
);

module.exports = router;