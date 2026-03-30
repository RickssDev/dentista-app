const catchAsync = require("../../utils/catchAsync");
const HandleResponse = require("../../utils/HandleResponse");
const service = require("./citas.service");

exports.getCitas = catchAsync(async (req, res) => {
  const data = await service.getCitas();
  return HandleResponse.success(res, 200, "Citas obtenidas", data);
});

exports.getCitaById = catchAsync(async (req, res) => {
  const data = await service.getCitaById(req.params.id);
  return HandleResponse.success(res, 200, "Cita obtenida", data);
});

exports.getCitasByEstado = catchAsync(async (req, res) => {
  const data = await service.getCitasByEstado(req.params.estado);
  return HandleResponse.success(res, 200, "Citas obtenidas por estado", data);
});

exports.getCitasByPaciente = catchAsync(async (req, res) => {
  const data = await service.getCitasByPaciente(req.params.id_paciente);
  return HandleResponse.success(res, 200, "Citas obtenidas por paciente", data);
});

exports.createCita = catchAsync(async (req, res) => {
  const data = await service.createCita(req.body);
  return HandleResponse.created(res, 201, "Cita creada", data);
});

exports.updateCita = catchAsync(async (req, res) => {
  const data = await service.updateCita(req.params.id, req.body);
  return HandleResponse.success(res, 200, data.message);
});

exports.deleteCita = catchAsync(async (req, res) => {
  const data = await service.deleteCita(req.params.id);
  return HandleResponse.success(res, 200, data.message);
});

exports.getCitasPorPeriodo = async (req, res, next) => {
  try {
    const { tipo } = req.params;

    const citas = await service.getCitasPorPeriodo(tipo);

    res.status(200).json({
      success: true,
      payload: citas
    });
  } catch (error) {
    next(error);
  }
};
