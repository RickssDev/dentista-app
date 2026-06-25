const express = require("express");
const router = express.Router();

const controller = require("./reportes.controller");

router.get("/citas", controller.getReporteCitas);

router.get("/citas/exportar/excel", controller.exportarExcel);

router.get("/citas/exportar/pdf", controller.exportarPdf);
module.exports = router;
