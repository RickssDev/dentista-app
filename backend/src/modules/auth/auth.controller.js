const catchAsync = require("../../utils/catchAsync");
const HandleResponse = require("../../utils/HandleResponse");
const service = require("./auth.service");

exports.register = catchAsync(async (req, res) => {
  const data = await service.register(req.body);
  return HandleResponse.created(res, 201, "Usuario registrado correctamente", data,);
});

exports.login = catchAsync(async (req, res) => {
  const data = await service.login(req.body);
  return HandleResponse.success(res, 200, "Login exitoso", data);
});

exports.cambiarContrasena = catchAsync(async (req, res) => {
  const idUsuario = req.user.id;
  const data = await service.cambiarContrasena(idUsuario, req.body);
  return HandleResponse.success(res, 200, "Contraseña actualizada correctamente", data, );
});

exports.googleLogin = catchAsync(async (req, res) => {
  const data = await service.googleLogin(req.body);
  return HandleResponse.success(res, 200, "Login exitoso", data);
});

exports.googleRegister = catchAsync(async (req, res) => {
  const data = await service.googleRegister(req.body);
  return HandleResponse.created(res, 201, "Cuenta creada con Google. Ahora inicia sesión.", data);
});

exports.solicitarRecuperacion = catchAsync(async (req, res) => {
  const data = await service.solicitarRecuperacion(req.body);

  return HandleResponse.success(
    res,
    200,
    'Solicitud procesada correctamente',
    data
  );
});

exports.restablecerContrasena = catchAsync(async (req, res) => {
  const data = await service.restablecerContrasena(req.body);

  return HandleResponse.success(
    res,
    200,
    'Contraseña restablecida correctamente',
    data
  );
});