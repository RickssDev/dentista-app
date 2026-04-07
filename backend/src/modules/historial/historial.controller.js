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

exports.getHistoriales = catchAsync(async (req, res) => {
const data = await service.getHistoriales();
return HandleResponse.success(res,200, 'Historiales obtenidos correctamente', data);
});