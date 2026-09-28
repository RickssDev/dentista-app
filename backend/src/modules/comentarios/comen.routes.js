const express = require("express");
const router = express.Router();
const controller = require("./comen.controller");
const { verifyToken } = require("../../middlewares/verifyToken");
const { authorizeRoles } = require("../../middlewares/authorizeRoles");

router.get("/publicos", controller.getComentariosPublicos);
router.get("/estado/:estado", verifyToken,authorizeRoles("Administrador", "Asistente"), controller.getComentarios);
router.get("/", verifyToken,authorizeRoles("Administrador", "Asistente"), controller.getComentarios);
router.get("/:id", verifyToken, authorizeRoles("Administrador", "Asistente"), controller.getComentarioById);
router.post("/", verifyToken, controller.createComentario);
router.patch("/:id/estado", verifyToken, authorizeRoles("Administrador", "Asistente"), controller.updateEstadoComentario);
router.patch("/:id/respuesta", verifyToken, authorizeRoles("Administrador", "Asistente"), controller.replyComentario);
router.delete("/:id", verifyToken, authorizeRoles("Administrador", "Asistente"), controller.deleteComentario);

module.exports = router;
