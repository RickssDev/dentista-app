const express = require("express");
const router = express.Router();
const controller = require("./citas.controller");

router.get("/", controller.getCitas);
router.get("/:id", controller.getCitaById);
router.get("/estado/:estado", controller.getCitasByEstado);
router.get("/paciente/:id_paciente", controller.getCitasByPaciente);
router.post("/", controller.createCita);
router.put("/:id", controller.updateCita);
router.delete("/:id", controller.deleteCita);
router.get('/filtro/:tipo', controller.getCitasPorPeriodo);

module.exports = router;
