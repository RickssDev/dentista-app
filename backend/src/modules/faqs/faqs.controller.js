const catchAsync = require('../../utils/catchAsync'); 
const HandleResponse = require('../../utils/HandleResponse');
const service = require('./faqs.service');

exports.createFaqs = catchAsync(async (req, res) => {
const data = await service.createFaqs(req.body);
return HandleResponse.created(res,201,'Pregunta creada correctamente',data);
});

exports.getFaqs = catchAsync(async (req, res) => {
const data = await service.getFaqs();
return HandleResponse.success(res, 200,'Preguntas obtenidas correctamente',data);
});
exports.getFaqsById = catchAsync(async (req, res) => {
const { id } = req.params;
const data = await service.getFaqsById(id);
return HandleResponse.success(res, 200,'Pregunta obtenida correctamente',data);
});
exports.updateFaqs = catchAsync(async (req, res) => {
const { id } = req.params;
const data = await service.updateFaqs(id, req.body);
return HandleResponse.success(res, 200,'Pregunta actualizada correctamente',data);
});
exports.deleteFaqs = catchAsync(async (req, res) => {
const { id } = req.params;
const data = await service.deleteFaqs(id);
return HandleResponse.success(res, 200,'Pregunta eliminada correctamente',data);
});