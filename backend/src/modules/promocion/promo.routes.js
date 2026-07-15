const express = require("express");
const router = express.Router();
const controller = require("./promo.controller");
const upload = require("../../utils/upload");

router.get("/", controller.getPromocion);
router.get("/publicos", controller.getPromocionPublicos);
router.get("/:id", controller.getPromocionById);
router.post("/", upload.single("imagen"), controller.createPromocion);
router.put("/:id", upload.single("imagen"), controller.updatePromocion);
router.delete("/:id", controller.deletePromocion);

module.exports = router;
