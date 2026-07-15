const catchAsync = require('../../utils/catchAsync'); 
const HandleResponse = require('../../utils/HandleResponse');
const service = require('./images.service');

exports.getImagen = catchAsync(async (req, res) => {
  const data = await service.getImagen();
  return HandleResponse.success(res, 200, 'Imágenes obtenidas', data);
});

exports.getImagenById = catchAsync(async (req, res) => {
  const data = await service.getImagenById(req.params.id);
  return HandleResponse.success(res, 200, 'Imagen obtenida', data);
});

exports.createImagen = catchAsync(async (req, res) => {
  if (req.file) {
    req.body.imagen = '/uploads/' + req.file.filename;
  }
  const data = await service.createImagen(req.body, req.file);
  return HandleResponse.created(res, 201, 'Imagen creada', data);
});

exports.updateImagen = catchAsync(async (req, res) => {
  if (req.file) {
    req.body.imagen = '/uploads/' + req.file.filename;
  }
  const data = await service.updateImagen(req.params.id, req.body);
  return HandleResponse.success(res, 200, data.message);
});

exports.deleteImagen = catchAsync(async (req, res) => {
  const data = await service.deleteImagen(req.params.id);
  return HandleResponse.success(res, 200, data.message);
});

exports.getImagenesPublicas = catchAsync(async (req, res) => {
  const data = await service.getImagenesPublicas();
  return HandleResponse.success(res, 200, 'Imágenes públicas obtenidas', data);
});