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

// La ruta de la imagen solo sale del archivo subido; un `imagen` en el cuerpo se descarta para que
// nadie apunte una imagen a un archivo ajeno de uploads/ (spec 029, TM6, /analyze A1 y A17)
const sinImagenDelCuerpo = (body) => {
  const datos = { ...(body || {}) };
  delete datos.imagen;
  return datos;
};

const rutaSubida = (file) => (file ? '/uploads/' + file.filename : undefined);

exports.createImagen = catchAsync(async (req, res) => {
  const data = await service.createImagen(sinImagenDelCuerpo(req.body), rutaSubida(req.file));
  return HandleResponse.created(res, 201, 'Imagen creada', data);
});

exports.updateImagen = catchAsync(async (req, res) => {
  const datos = sinImagenDelCuerpo(req.body);
  if (req.file) {
    datos.imagen = rutaSubida(req.file);
  }
  const data = await service.updateImagen(req.params.id, datos);
  return HandleResponse.success(res, 200, 'Imagen actualizada correctamente', data);
});

exports.deleteImagen = catchAsync(async (req, res) => {
  const data = await service.deleteImagen(req.params.id);
  return HandleResponse.success(res, 200, 'Imagen eliminada correctamente', data);
});

exports.getImagenesPublicas = catchAsync(async (req, res) => {
  const data = await service.getImagenesPublicas();
  return HandleResponse.success(res, 200, 'Imágenes públicas obtenidas', data);
});