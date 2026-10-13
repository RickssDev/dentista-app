const repo = require("./dashboard.repository");

const ZONA = "America/Mexico_City";
const DIAS_PROXIMAS = 7;

// Fecha YYYY-MM-DD en hora de México (no depende de la zona horaria de MySQL)
const hoyMX = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: ZONA });

const sumarDias = (fecha, dias) => {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
};

exports.getResumen = async () => {
  const hoy = hoyMX();
  const manana = sumarDias(hoy, 1);
  const finProximas = sumarDias(hoy, DIAS_PROXIMAS);
  const inicioMes = `${hoy.slice(0, 8)}01`;

  const [
    citasHoy,
    citasProximas,
    pacientesNuevos,
    comentariosPendientes,
    agendaHoy,
  ] = await Promise.all([
    repo.countCitasDelDia(hoy),
    repo.countCitasProximas(manana, finProximas),
    repo.countPacientesNuevos(inicioMes),
    repo.countComentariosPendientes(),
    repo.getCitasPendientesDelDia(hoy),
  ]);

  return {
    fecha: hoy,
    estadisticas: {
      citasHoy,
      citasProximas,
      pacientesNuevos,
      comentariosPendientes,
    },
    agendaHoy,
  };
};