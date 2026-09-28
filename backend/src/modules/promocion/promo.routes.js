const express = require("express");
const router = express.Router();
const controller = require("./promo.controller");
const upload = require("../../utils/upload");
const { verifyToken } = require("../../middlewares/verifyToken");
const { authorizeRoles } = require("../../middlewares/authorizeRoles");

router.get("/", verifyToken,authorizeRoles("Administrador", "Asistente"), controller.getPromocion);
router.get("/publicos", controller.getPromocionPublicos);
router.get("/:id", verifyToken, authorizeRoles("Administrador", "Asistente"), controller.getPromocionById);
router.post("/", verifyToken, authorizeRoles("Administrador", "Asistente"), upload.single("imagen"), controller.createPromocion);
router.put("/:id", verifyToken, authorizeRoles("Administrador", "Asistente"), upload.single("imagen"), controller.updatePromocion);
router.delete("/:id", verifyToken, authorizeRoles("Administrador", "Asistente"), controller.deletePromocion);

module.exports = router;
