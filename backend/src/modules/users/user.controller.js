const catchAsync = require('../../utils/catchAsync'); 
const HandleResponse = require('../../utils/HandleResponse');
const service = require('./user.service');

exports.getUsuarios = catchAsync(async (req, res) => {
  const data = await service.getUsuarios();
  return HandleResponse.success(res, 200, 'Usuarios obtenidos', data);
});

exports.getUsuarioById = catchAsync(async (req, res) => {
  const data = await service.getUsuarioById(req.params.id);
  return HandleResponse.success(res, 200, 'Usuario obtenido', data);
});

// La imagen solo llega del archivo subido; una `imagen` en el cuerpo se ignora (spec 021 CA1)
const imagenSubida = (req) => (req.file ? '/uploads/' + req.file.filename : null);

exports.createUsuario = catchAsync(async (req, res) => {
  const data = await service.createUsuario(req.body, imagenSubida(req));
  return HandleResponse.created(res, 201, 'Usuario creado', data);
});

exports.updateUsuario = catchAsync(async (req, res) => {
  const data = await service.updateUsuario(req.params.id, req.body, imagenSubida(req));
  return HandleResponse.success(res, 200, 'Usuario actualizado', data);
});

exports.deleteUsuario = catchAsync(async (req, res) => {
  const data = await service.deleteUsuario(req.params.id);
  return HandleResponse.success(res, 200, data.message, {
    desactivado: data.desactivado, });
});