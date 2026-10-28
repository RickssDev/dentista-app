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
exports.getMisCitas = catchAsync(async (req, res) => {
  const idUsuario = req.user.id;

  const data = await service.getMisCitas(idUsuario);

  return HandleResponse.success(
    res,
    200,
    "Mis citas obtenidas correctamente",
    data
  );
});

exports.cancelarCita = catchAsync(async (req, res) => {
const { id } = req.params;
const { motivo } = req.body;
const data =await service.cancelarCita(id, motivo);
return HandleResponse.success(res,200,'Cita cancelada correctamente',data);
});

exports.createCitaPaciente = catchAsync(async (req, res) => {
  const idUsuario = req.user.id;

  const data = await service.createCitaPaciente(
    idUsuario,
    req.body
  );

  return HandleResponse.success(
    res,
    201,
    "Cita creada correctamente",
    data
  );
});

exports.getProximaCita = catchAsync(async (req, res) => {
  const idUsuario = req.user.id;
  const cita = await service.getProximaCita(idUsuario);
  res.status(200).json({status: "success", data: cita, });
});

exports.getHorariosDisponibles = catchAsync(async (req, res) => {
  const { fecha, id_servicio } = req.query;
  const horarios = await service.getHorariosDisponibles(fecha,id_servicio);
  res.status(200).json({status: "success",data: horarios,});
});


exports.updateMiCita = catchAsync(async (req, res) => {
  const data = await service.updateMiCita(req.user.id, req.params.id, req.body);
  return HandleResponse.success(res, 200, data.message);
});
 
exports.cancelarMiCita = catchAsync(async (req, res) => {
  const data = await service.cancelarMiCita(
    req.user.id,
    req.params.id,
    req.body.motivo,
  );
  return HandleResponse.success(res, 200, data.message);
});