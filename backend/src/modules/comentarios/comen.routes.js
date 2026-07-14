const express = require("express");
const router = express.Router();
const controller = require("./comen.controller");

router.get("/publicos", controller.getComentariosPublicos);
router.get("/estado/:estado", controller.getComentarios);
router.get("/", controller.getComentarios);
router.get("/:id", controller.getComentarioById);
router.post("/", controller.createComentario);
router.patch("/:id/estado", controller.updateEstadoComentario);
router.patch("/:id/respuesta", controller.replyComentario);
router.delete("/:id", controller.deleteComentario);

module.exports = router;
