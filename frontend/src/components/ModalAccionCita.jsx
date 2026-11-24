import { useEffect, useState } from "react";
import ModalFormulario from "./ModalFormulario";
import { api } from "../services/api";
import { hoyClave } from "../utils/fechas";

// Formulario para reprogramar o cancelar una cita del paciente (spec 030). Lo usan Inicio y
// «Mis citas» con los mismos textos y validaciones. El foco al cerrar lo decide cada pantalla, y
// cada apertura monta una instancia nueva (con `key`), así que el formulario empieza vacío.

const FORM_VACIO = { fecha: "", hora: "", motivo: "" };

const TITULOS = {
  reprogramar: "Reprogramar cita",
  cancelar: "Cancelar cita",
};

const ERRORES = {
  reprogramar: "No se pudo reprogramar la cita.",
  cancelar: "No se pudo cancelar la cita.",
};

const datosDe = (res) => res?.payload ?? res?.data ?? res;

const formatearHora = (hora) => {
  if (!hora) return "";
  const [h, m] = hora.split(":");
  const horas = parseInt(h, 10);
  const periodo = horas >= 12 ? "PM" : "AM";
  const hora12 = String(horas % 12 || 12).padStart(2, "0");
  return `${hora12}:${m} ${periodo}`;
};

function ModalAccionCita({ cita, subtitulo, accion, ancho, onCerrar, onHecho }) {
  const fechaMinima = hoyClave();
  const [form, setForm] = useState(FORM_VACIO);
  const [horarios, setHorarios] = useState([]);
  const [cargandoHorarios, setCargandoHorarios] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");

  // Horarios disponibles al reprogramar
  useEffect(() => {
    const idServicio = cita?.id_servicio;

    if (accion !== "reprogramar" || !form.fecha || !idServicio) {
      setHorarios([]);
      return;
    }

    let cancelado = false;

    const cargarHorarios = async () => {
      try {
        setCargandoHorarios(true);
        const res = await api(
          `/citas/horarios-disponibles?fecha=${form.fecha}&id_servicio=${idServicio}`
        );
        const data = datosDe(res);
        if (!cancelado) setHorarios(Array.isArray(data) ? data : []);
      } catch (err) {
        if (cancelado) return;
        console.error(err);
        setHorarios([]);
        setError(err.message || "No se pudieron cargar los horarios.");
      } finally {
        if (!cancelado) setCargandoHorarios(false);
      }
    };

    cargarHorarios();

    return () => {
      cancelado = true;
    };
  }, [accion, form.fecha, cita?.id_servicio]);

  const confirmar = async () => {
    if (!cita || !accion) return;

    const motivo = form.motivo.trim();
    if (!motivo) {
      setError(
        accion === "cancelar"
          ? "Escribe el motivo de la cancelación."
          : "Escribe el motivo de la reprogramación."
      );
      return;
    }

    try {
      setProcesando(true);
      setError("");

      if (accion === "reprogramar") {
        await api(`/citas/mias/${cita.id}`, "PUT", {
          fecha_agendada: form.fecha,
          hora: form.hora,
          motivo,
        });
      } else {
        await api(`/citas/mias/${cita.id}/cancelar`, "PATCH", {
          motivo,
        });
      }

      onHecho(accion);
    } catch (err) {
      console.error(err);
      setError(err.message || ERRORES[accion]);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <ModalFormulario
      abierto={!!accion}
      titulo={TITULOS[accion] || ""}
      subtitulo={subtitulo}
      onCerrar={onCerrar}
      onSubmit={confirmar}
      enviando={procesando}
      error={error}
      textoEnviar={accion === "cancelar" ? "Cancelar cita" : "Reprogramar"}
      textoEnviando="Procesando..."
      textoCancelar={accion === "cancelar" ? "Volver" : "Cancelar"}
      peligro={accion === "cancelar"}
      ancho={ancho}
    >
      {accion === "reprogramar" && (
        <div className="mf-grid">
          <label className="mf-campo">
            <span>Nueva fecha</span>
            <input
              type="date"
              min={fechaMinima}
              value={form.fecha}
              onChange={(e) =>
                setForm({ ...form, fecha: e.target.value, hora: "" })
              }
              required
            />
          </label>

          <label className="mf-campo">
            <span>Nueva hora</span>
            <select
              value={form.hora}
              onChange={(e) => setForm({ ...form, hora: e.target.value })}
              disabled={!form.fecha || cargandoHorarios}
              required
            >
              <option value="">
                {!form.fecha
                  ? "Primero selecciona una fecha"
                  : cargandoHorarios
                    ? "Buscando horarios..."
                    : horarios.length === 0
                      ? "No hay horarios disponibles"
                      : "Seleccionar horario"}
              </option>
              {horarios.map((horario) => (
                <option key={horario} value={horario}>
                  {formatearHora(horario)}
                </option>
              ))}
            </select>
          </label>

          <label className="mf-campo mf-ancho">
            <span>Motivo</span>
            <textarea
              rows={3}
              placeholder="Motivo de la reprogramación"
              value={form.motivo}
              onChange={(e) => setForm({ ...form, motivo: e.target.value })}
              required
            />
          </label>
        </div>
      )}

      {accion === "cancelar" && (
        <label className="mf-campo">
          <span>Motivo</span>
          <textarea
            rows={3}
            placeholder="Motivo de la cancelación"
            value={form.motivo}
            onChange={(e) => setForm({ ...form, motivo: e.target.value })}
            required
          />
        </label>
      )}
    </ModalFormulario>
  );
}

export default ModalAccionCita;
