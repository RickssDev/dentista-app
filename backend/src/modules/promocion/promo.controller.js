const service = require('./promo.service');
const catchAsync = require('../../utils/catchAsync');
const HandleResponse = require('../../utils/HandleResponse');

exports.createPromocion = catchAsync(async (req, res) => {
const data = await service.createPromocion(req.body, req.file);
HandleResponse.success(res, 201, 'Promoción creada correctamente', data);
});

exports.getPromocion = catchAsync(async (req, res) => {
const data = await service.getPromocion();
HandleResponse.success(res, 200, 'Promociones obtenidas correctamente', data);
});

exports.getPromocionById = catchAsync(async (req, res) => {
const data = await service.getPromocionById(req.params.id);

HandleResponse.success(res, 200, 'Promoción obtenida correctamente', data);
});

exports.updatePromocion = catchAsync(async (req, res) => {
const data = await service.updatePromocion(
    req.params.id,
    req.body,
    req.file
);

HandleResponse.success(res, 200, 'Promoción actualizada correctamente', data);
});

exports.deletePromocion = catchAsync(async (req, res) => {
const data = await service.deletePromocion(req.params.id);
HandleResponse.success(res, 200, data.message, null);
});