const catchAsync = require("../../utils/catchAsync");
const HandleResponse = require("../../utils/HandleResponse");
const service = require("./reportes.service");

exports.getReporteCitas = catchAsync(async (req, res) => {
const { fechaInicio, fechaFin } = req.query;

const data = await service.getReporteCitas(fechaInicio, fechaFin);

return HandleResponse.success(
    res,
    200,
    "Reporte generado correctamente",
    data, );
});

exports.exportarExcel = catchAsync(async (req, res) => {
const { fechaInicio, fechaFin } = req.query;

const workbook = await service.exportarReporteExcel(fechaInicio, fechaFin);

res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",  );

res.setHeader(
    "Content-Disposition",
    `attachment; filename=reporte-citas.xlsx`, );

await workbook.xlsx.write(res);

res.end();
});

exports.exportarPdf = catchAsync(async (req, res) => {
const { fechaInicio, fechaFin } = req.query;

const pdf = await service.exportarReportePdf(fechaInicio, fechaFin);

res.setHeader("Content-Type", "application/pdf");

res.setHeader(
    "Content-Disposition",
    "attachment; filename=reporte-citas.pdf",);

pdf.pipe(res);
pdf.end();
});

exports.getReportePacientes = catchAsync(async (req, res) => {
  const { fechaInicio, fechaFin } = req.query;

  const data = await service.getReportePacientes(fechaInicio, fechaFin);

  return HandleResponse.success(
    res,
    200,
    "Reporte de pacientes generado correctamente",
    data,
  );
});

exports.exportarPacientesExcel = catchAsync(async (req, res) => {
  const { fechaInicio, fechaFin } = req.query;

  const workbook = await service.exportarReportePacientesExcel(
    fechaInicio,
    fechaFin,
  );

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=reporte-pacientes.xlsx",
  );

  await workbook.xlsx.write(res);
  res.end();
});

exports.exportarPacientesPdf = catchAsync(async (req, res) => {
  const { fechaInicio, fechaFin } = req.query;

  const pdf = await service.exportarReportePacientesPdf(
    fechaInicio,
    fechaFin,
  );

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=reporte-pacientes.pdf",
  );

  pdf.pipe(res);
  pdf.end();
});