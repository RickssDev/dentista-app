const repo = require("./reportes.repository");
const AppError = require("../../utils/AppError");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");

const FECHA_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DIAS = 366;

const validarRango = (fechaInicio, fechaFin) => {
  if (typeof fechaInicio !== "string" || typeof fechaFin !== "string") {
    throw new AppError("Debe proporcionar fechaInicio y fechaFin", 400);
  }

  if (!FECHA_REGEX.test(fechaInicio) || !FECHA_REGEX.test(fechaFin)) {
    throw new AppError("Las fechas deben tener formato YYYY-MM-DD", 400);
  }

  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);

  if (isNaN(inicio) || isNaN(fin)) {
    throw new AppError("Fecha inválida", 400);
  }

  if (fechaInicio > fechaFin) {
    throw new AppError("La fecha inicial no puede ser mayor a la fecha final", 400);
  }

  if ((fin - inicio) / 86400000 > MAX_DIAS) {
    throw new AppError("El rango máximo es de 1 año", 400);
  }
};

const formatDate = (date) => {
  return new Date(date).toISOString().split("T")[0];
};

exports.getReporteCitas = async (fechaInicio, fechaFin) => {
  validarRango(fechaInicio, fechaFin);

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
  validarRango(fechaInicio, fechaFin);
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
  validarRango(fechaInicio, fechaFin);

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

  const headers = ["Fecha", "Hora", "Paciente", "Servicio", "Estado"];
  const colWidths = [80, 60, 150, 120, 80];
  const startX = 50;
  const ROW_H = 20;
  const colX = colWidths.map(
    (_, i) => startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0),
  );

  const dibujarFila = (celdas, y, negrita) => {
    doc.font(negrita ? "Helvetica-Bold" : "Helvetica").fontSize(10);
    celdas.forEach((texto, i) => {
      doc.text(String(texto ?? ""), colX[i], y, {
        width: colWidths[i] - 5,
        height: 14,
        ellipsis: true,
      });
    });
  };

  let y = doc.y + 10;
  dibujarFila(headers, y, true);
  y += ROW_H;

  citas.forEach((cita) => {
    if (y > doc.page.height - doc.page.margins.bottom - ROW_H) {
      doc.addPage();
      y = doc.page.margins.top;
      dibujarFila(headers, y, true);
      y += ROW_H;
    }

    dibujarFila(
      [
        formatDate(cita.fecha_agendada),
        cita.hora,
        `${cita.nombre_usuario} ${cita.apellido}`,
        cita.nombre_servicio,
        cita.estado,
      ],
      y,
      false,
    );
    y += ROW_H;
  });

  return doc;
};

exports.getReportePacientes = async (fechaInicio, fechaFin) => {
  validarRango(fechaInicio, fechaFin);

  const pacientes = await repo.getReportePacientesPorRango(
    fechaInicio,
    fechaFin,
  );

  return {
    clinica: "Clínica Dental Dentissa",
    periodo: { fechaInicio, fechaFin },
    estadisticas: {
      total: pacientes.length,
    },
    pacientes,
  };
};

exports.exportarReportePacientesExcel = async (fechaInicio, fechaFin) => {
  validarRango(fechaInicio, fechaFin);

  const pacientes = await repo.getReportePacientesPorRango(
    fechaInicio,
    fechaFin,
  );

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Pacientes nuevos");

  worksheet.columns = [
    { header: "ID paciente", key: "id_paciente", width: 15 },
    { header: "Nombre", key: "nombre", width: 30 },
    { header: "Correo", key: "correo", width: 35 },
    { header: "Fecha de registro", key: "fecha_registro", width: 22 },
  ];

  pacientes.forEach((paciente) => {
    worksheet.addRow({
      id_paciente: paciente.id_paciente,
      nombre: `${paciente.nombre_usuario} ${paciente.apellido}`,
      correo: paciente.correo,
      fecha_registro: formatDate(paciente.fecha_registro),
    });
  });

  return workbook;
};

exports.exportarReportePacientesPdf = async (fechaInicio, fechaFin) => {
  validarRango(fechaInicio, fechaFin);

  const pacientes = await repo.getReportePacientesPorRango(
    fechaInicio,
    fechaFin,
  );

  const doc = new PDFDocument({ margin: 50 });

  doc.fontSize(18).text("Clínica Dental Dentissa", { align: "center" });
  doc.moveDown();
  doc.fontSize(14).text("Reporte de Pacientes Nuevos", { align: "center" });
  doc.moveDown();
  doc.fontSize(12).text(`Periodo: ${fechaInicio} - ${fechaFin}`);
  doc.text(`Total de pacientes nuevos: ${pacientes.length}`);
  doc.moveDown();

  const headers = ["ID", "Nombre", "Correo", "Fecha registro"];
  const colWidths = [40, 140, 190, 100];
  const startX = 50;
  const rowHeight = 25;

  const colX = colWidths.map(
    (_, i) => startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0),
  );

  const dibujarFila = (celdas, y, negrita) => {
    doc.font(negrita ? "Helvetica-Bold" : "Helvetica").fontSize(8);

    celdas.forEach((texto, i) => {
      doc.text(String(texto ?? ""), colX[i], y, {
        width: colWidths[i] - 5,
        height: 18,
        ellipsis: true,
      });
    });
  };

  let y = doc.y + 10;
  dibujarFila(headers, y, true);
  y += rowHeight;

  pacientes.forEach((paciente) => {
    if (y > doc.page.height - doc.page.margins.bottom - rowHeight) {
      doc.addPage();
      y = doc.page.margins.top;
      dibujarFila(headers, y, true);
      y += rowHeight;
    }

    dibujarFila(
      [
        paciente.id_paciente,
        `${paciente.nombre_usuario} ${paciente.apellido}`,
        paciente.correo,
        formatDate(paciente.fecha_registro),
      ],
      y,
      false,
    );

    y += rowHeight;
  });

  return doc;
};
