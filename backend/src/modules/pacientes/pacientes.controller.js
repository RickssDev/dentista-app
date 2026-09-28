const catchAsync = require('../../utils/catchAsync'); 
const HandleResponse = require('../../utils/HandleResponse');
const service = require('./pacientes.service');

exports.getPacienteByUserId = catchAsync(async (req, res) => {
const { idUsuario } = req.params;
const data = await service.getPacienteByUserId(idUsuario);
return HandleResponse.success(res,200,'Perfil obtenido correctamente',data);
});

exports.createPaciente = catchAsync(async (req, res) => {
const idUsuario = req.user.id;
const data = await service.createPaciente(
    req.body,
    idUsuario
  );

  return HandleResponse.success(
    res,
    201,
    'Perfil creado correctamente',
    data
  );
});
exports.getPerfil = catchAsync(async (req, res) => {
  const idUsuario = req.user.id;

  const data = await service.getPerfil(idUsuario);

  return HandleResponse.success(
    res,
    200,
    "Perfil obtenido correctamente",
    data
  );
});

exports.updatePerfil = catchAsync(async (req, res) => {
  const idUsuario = req.user.id;

  const data = await service.updatePerfil(
    idUsuario,
    req.body
  );

  return HandleResponse.success(
    res,
    200,
    "Perfil actualizado correctamente",
    data
  );
});

exports.getPacientesSelect = catchAsync(async (req, res) => {
    const { busqueda = "" } = req.query;
    const data = await service.getPacientesSelect(busqueda);
    return HandleResponse.success(res, 200, "Pacientes obtenidos correctamente", data);
});