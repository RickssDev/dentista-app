const catchAsync = require("../../utils/catchAsync");
const HandleResponse = require("../../utils/HandleResponse");
const service = require("./dashboard.service");

exports.getResumen = catchAsync(async (req, res) => {
  const data = await service.getResumen();
  return HandleResponse.success(res, 200, "Resumen obtenido", data);
});