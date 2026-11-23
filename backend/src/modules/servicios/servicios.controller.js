const catchAsync = require("../../utils/catchAsync");
const HandleResponse = require("../../utils/HandleResponse");
const service = require("./servicios.service");

exports.getServicios = catchAsync(async (req, res) => {
  const data = await service.getServicios();
  return HandleResponse.success(res, 200, "Servicios obtenidos", data);
});

exports.getServicioById = catchAsync(async (req, res) => {
  const data = await service.getServicioById(req.params.id);
  return HandleResponse.success(res, 200, "Servicio obtenido", data);
});

// La imagen solo sale del archivo subido; una `imagen` en el cuerpo se descarta para que nadie
// apunte un servicio a un archivo ajeno de uploads/ (ficha 2026-11-23-fix-imagen-servicios)
const conImagenSubida = (body, file) => {
  const datos = { ...(body || {}) };
  delete datos.imagen;
  if (file) datos.imagen = "/uploads/" + file.filename;
  return datos;
};

exports.createServicio = catchAsync(async (req, res) => {
  const data = await service.createServicio(conImagenSubida(req.body, req.file));
  return HandleResponse.created(res, 201, "Servicio creado", data);
});

exports.updateServicio = catchAsync(async (req, res) => {
  const data = await service.updateServicio(req.params.id, conImagenSubida(req.body, req.file));
  return HandleResponse.success(res, 200, "Servicio actualizado", data);
});

exports.deleteServicio = catchAsync(async (req, res) => {
  const data = await service.deleteServicio(req.params.id);
  return HandleResponse.success(res, 200, data.message, {desactivado: data.desactivado,});
});

exports.getServiciosPublicos = catchAsync(async (req, res) => {
  const data = await service.getServiciosPublicos();
  return HandleResponse.success(res, 200, "Servicios obtenidos", data);
});
