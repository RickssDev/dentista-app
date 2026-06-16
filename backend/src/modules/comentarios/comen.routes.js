const express = require("express");
const router = express.Router();
const controller = require("./comen.controller");

router.get("/", controller.getComentarios);
router.get("/publicos", controller.getComentariosPublicos);
router.get("/:id", controller.getComentarioById);
router.post("/", controller.createComentario);
router.patch("/:id/estado", controller.updateEstadoComentario);
router.patch("/:id/respuesta", controller.replyComentario);

module.exports = router;
