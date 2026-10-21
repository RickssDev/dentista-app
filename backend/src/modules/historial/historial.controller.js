const catchAsync = require('../../utils/catchAsync');
const HandleResponse = require('../../utils/HandleResponse');
const service = require('./historial.service');

exports.crearDesdeCita = catchAsync(async (req, res) => {
const { idCita } = req.params;
const data = await service.crearDesdeCita(idCita, req.body);
return HandleResponse.success(res, 201, 'Historial creado correctamente', data);
});

exports.obtenerDatosFormulario = catchAsync(async (req, res) => {
const { idCita } = req.params;
const data = await service.obtenerDatosFormulario(idCita);
return HandleResponse.success(res, 200, 'Datos del formulario obtenidos correctamente', data);
});

exports.getHistorialById = catchAsync(async (req, res) => {
  const { idHistorial } = req.params;
  const data = await service.getHistorialById(idHistorial);
  return HandleResponse.success(res, 200, 'Historial obtenido correctamente', data);
});

exports.getHistoriales = catchAsync(async (req, res) => {
const data = await service.getHistoriales();
return HandleResponse.success(res,200, 'Historiales obtenidos correctamente', data);
});

exports.actualizarHistorial = catchAsync(async (req, res) => {
  const { idHistorial } = req.params;
  const resultado = await service.actualizarHistorial(idHistorial, req.body);
  res.status(200).json(resultado);
});

exports.getHistorialPaciente = catchAsync(async (req, res) => {
  const { idPaciente } = req.params;
  const data = await service.getHistorialPaciente(idPaciente);
  return HandleResponse.success(res, 200, 'Historial del paciente obtenido correctamente', data);
});

exports.getServicios = catchAsync(async (req, res) => {
  const data = await service.getServicios();
  return HandleResponse.success(res, 200, 'Servicios obtenidos correctamente', data);
});

exports.registrarPaciente = catchAsync(async (req, res) => {
  const data = await service.registrarPaciente(req.body);
  return HandleResponse.success(res, 201, 'Paciente registrado correctamente', data);
});