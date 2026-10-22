const express = require("express");
const router = express.Router();
const controller = require("./auth.controller");
const { verifyToken } = require("../../middlewares/verifyToken");

router.post("/register", controller.register);
router.post("/login", controller.login);
router.put("/cambiarContrasena", verifyToken, controller.cambiarContrasena);
router.post("/google/login", controller.googleLogin);
router.post("/google/register", controller.googleRegister);

module.exports = router;
