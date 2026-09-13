import { api } from "./api";

// ==========================
// LISTAR TODAS LAS CITAS
// ==========================
export const obtenerCitas = async () => {
  return await api("/citas");
};

// ==========================
// FILTRAR POR AGENDA
// diaria | semanal | mensual
// ==========================
export const filtrarAgenda = async (modo) => {
  return await api(`/citas/filtro/${modo}`);
};

// ==========================
// FILTRAR POR ESTADO
// pendiente | completada
// ==========================
export const filtrarEstado = async (estado) => {
  return await api(`/citas/estado/${estado}`);
};

// ==========================
// CREAR CITA
// ==========================
export const crearCita = async (data) => {
  return await api("/citas", "POST", data);
};

// ==========================
// REPROGRAMAR
// ==========================
export const reprogramarCita = async (id, data) => {
  return await api(`/citas/${id}`, "PUT", data);
};

// ==========================
// CANCELAR
// ==========================
export const cancelarCita = async (id, motivo) => {
  return await api(
    `/citas/${id}/cancelar`,
    "PATCH",
    {
      estado: "cancelada",
      motivo
    }
  );
};

// ==========================
// FINALIZAR
// ==========================
export const finalizarCita = async (id, data) => {
  return await api(
    `/historial/finalizar-cita/${id}`,
    "POST",
    data
  );
};