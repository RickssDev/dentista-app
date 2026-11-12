const catchAsync = require('../../utils/catchAsync'); 
const HandleResponse = require('../../utils/HandleResponse');
const service = require('./user.service');
const borrarArchivo = require('../../utils/borrarArchivo');

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

// Si el alta o la edición se rechazan, la imagen que multer ya guardó no debe quedar huérfana
const conImagenSubida = async (req, operacion) => {
  const imagen = imagenSubida(req);
  try {
    return await operacion(imagen);
  } catch (error) {
    if (imagen) await borrarArchivo(imagen);
    throw error;
  }
};

exports.createUsuario = catchAsync(async (req, res) => {
  const data = await conImagenSubida(req, (imagen) => service.createUsuario(req.body, imagen));
  return HandleResponse.created(res, 201, 'Usuario creado', data);
});

exports.updateUsuario = catchAsync(async (req, res) => {
  const data = await conImagenSubida(req, (imagen) => service.updateUsuario(req.params.id, req.body, imagen));
  return HandleResponse.success(res, 200, 'Usuario actualizado', data);
});

exports.deleteUsuario = catchAsync(async (req, res) => {
  const data = await service.deleteUsuario(req.params.id);
  return HandleResponse.success(res, 200, data.message, {
    desactivado: data.desactivado, });
});