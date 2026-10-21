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

exports.createServicio = catchAsync(async (req, res) => {
  if (req.file) {
    req.body.imagen = "/uploads/" + req.file.filename;}
  const data = await service.createServicio(req.body);
  return HandleResponse.created(res, 201, "Servicio creado", data);
});

exports.updateServicio = catchAsync(async (req, res) => {
  if (req.file) {
    req.body.imagen = "/uploads/" + req.file.filename;
  }
  const data = await service.updateServicio(req.params.id, req.body);
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
