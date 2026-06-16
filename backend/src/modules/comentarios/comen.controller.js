const catchAsync = require("../../utils/catchAsync");
const HandleResponse = require("../../utils/HandleResponse");
const service = require("./comen.service");

exports.getComentarios = catchAsync(async (req, res) => {
  const data = await service.getComentarios();
  return HandleResponse.success(res, 200, "Comentarios obtenidos", data);
});

exports.getComentariosPublicos = catchAsync(async (req, res) => {
  const data = await service.getComentariosPublicos();
  return HandleResponse.success(res, 200, "Comentarios públicos obtenidos", data,);
});

exports.getComentarioById = catchAsync(async (req, res) => {
  const data = await service.getComentarioById(req.params.id);
  return HandleResponse.success(res, 200, "Comentario obtenido", data);
});

exports.createComentario = catchAsync(async (req, res) => {
  const data = await service.createComentario(req.body);
  return HandleResponse.created(res, 201, "Comentario creado", data);
});

exports.replyComentario = catchAsync(async (req, res) => {
  const data = await service.replyComentario
  (req.params.id, req.body.respuesta_admin,);
  return HandleResponse.success(res, 200, data.message);
});

exports.updateEstadoComentario = catchAsync(async (req, res) => {
  const data = await service.updateEstadoComentario
  (req.params.id, req.body.estado,);
  return HandleResponse.success(res, 200, data.message);
});
