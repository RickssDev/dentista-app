const express = require("express");
const router = express.Router();
const controller = require("./auth.controller");
const { verifyToken } = require("../../middlewares/verifyToken");
const {
  limitadorLogin,
  limitadorRegistro,
  limitadorCambioContrasena,
} = require("../../middlewares/rateLimiters");

router.post("/register", limitadorRegistro, controller.register);
router.post("/login", limitadorLogin, controller.login);
router.put(
  "/cambiarContrasena",
  verifyToken,
  limitadorCambioContrasena,
  controller.cambiarContrasena,
);
router.post("/google/login", limitadorLogin, controller.googleLogin);
router.post("/google/register", limitadorRegistro, controller.googleRegister);

module.exports = router;