const repo = require("./reportes.repository");
const AppError = require("../../utils/AppError");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");

const formatDate = (date) => {
  return new Date(date).toISOString().split("T")[0];
};

exports.getReporteCitas = async (fechaInicio, fechaFin) => {
  if (!fechaInicio || !fechaFin) {
    throw new AppError("Debe proporcionar fechaInicio y fechaFin", 400);
  }

  if (fechaInicio > fechaFin) {
    throw new AppError(
      "La fecha inicial no puede ser mayor a la fecha final",
      400,
    );
  }

  const citas = await repo.getReporteCitasPorRango(fechaInicio, fechaFin);
  const total = citas.length;
  const completadas = citas.filter((c) => c.estado === "completada").length;
  const pendientes = citas.filter((c) => c.estado === "pendiente").length;
  const canceladas = citas.filter((c) => c.estado === "cancelada").length;

  return {
    clinica: "Clínica Dental Dentissa",

    periodo: {
      fechaInicio,
      fechaFin,
    },

    estadisticas: {
      total,
      completadas,
      pendientes,
      canceladas,
    },
  };
};

exports.exportarReporteExcel = async (fechaInicio, fechaFin) => {
  const citas = await repo.getReporteCitasPorRango(fechaInicio, fechaFin);
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Reporte de Citas");

  worksheet.columns = [
    { header: "ID", key: "id_cita", width: 10 },
    { header: "Fecha", key: "fecha_agendada", width: 15 },
    { header: "Hora", key: "hora", width: 15 },
    { header: "Paciente", key: "paciente", width: 30 },
    { header: "Servicio", key: "servicio", width: 30 },
    { header: "Estado", key: "estado", width: 20 },
    { header: "Motivo", key: "motivo", width: 40 },
  ];

  citas.forEach((cita) => {
    worksheet.addRow({
      id_cita: cita.id_cita,
      fecha_agendada: cita.fecha_agendada,
      hora: cita.hora,
      paciente: `${cita.nombre_usuario} ${cita.apellido}`,
      servicio: cita.nombre_servicio,
      estado: cita.estado,
      motivo: cita.motivo,
    });
  });

  return workbook;
};

exports.exportarReportePdf = async (fechaInicio, fechaFin) => {
  const citas = await repo.getReporteCitasPorRango(fechaInicio, fechaFin);

  const total = citas.length;
  const completadas = citas.filter((c) => c.estado === "completada").length;
  const pendientes = citas.filter((c) => c.estado === "pendiente").length;
  const canceladas = citas.filter((c) => c.estado === "cancelada").length;

  const doc = new PDFDocument({ margin: 50 });

  doc.fontSize(18).text("Clínica Dental Dentissa", { align: "center" });
  doc.moveDown();
  doc.fontSize(14).text("Reporte de Citas", { align: "center" });

  doc.moveDown();
  doc.fontSize(12).text(`Periodo: ${fechaInicio} - ${fechaFin}`);
  doc.moveDown();

  doc.text(`Total citas: ${total}`);
  doc.text(`Completadas: ${completadas}`);
  doc.text(`Pendientes: ${pendientes}`);
  doc.text(`Canceladas: ${canceladas}`);

  doc.moveDown();

  const table = {
    headers: ["Fecha", "Hora", "Paciente", "Servicio", "Estado"],
    rows: citas.map((cita) => [
      cita.fecha_agendada,
      cita.hora,
      `${cita.nombre_usuario} ${cita.apellido}`,
      cita.nombre_servicio,
      cita.estado,
    ]),
  };

  doc.fontSize(10);

  const startX = 50;
  let y = doc.y + 10;

  const headers = ["Fecha", "Hora", "Paciente", "Servicio", "Estado"];
  const colWidths = [80, 60, 150, 120, 80];

  headers.forEach((h, i) => {
    doc.text(h, startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0), y);
  });

  y += 20;

  citas.forEach((cita) => {
    const row = [
      formatDate(cita.fecha_agendada),
      cita.hora,
      `${cita.nombre_usuario} ${cita.apellido}`,
      cita.nombre_servicio,
      cita.estado,
    ];

    row.forEach((text, i) => {
      doc.text(
        text,
        startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0),
        y,
      );
    });

    y += 20;
  });

  return doc;
};
