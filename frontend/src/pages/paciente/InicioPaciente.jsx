import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaRegCalendarAlt,
  FaRegClock,
  FaCalendarAlt,
  FaTimesCircle,
  FaBell,
} from "react-icons/fa";
import Sidebar from "../../components/sidebar";
import EncabezadoModulo from "../../components/EncabezadoModulo";
import ModalFormulario from "../../components/ModalFormulario";
import ModalConfirmacion from "../../components/ModalConfirmacion";
import { api } from "../../services/api";
import { hoyClave } from "../../utils/fechas";
import "../../styles/AdminPanel.css";
import "../../styles/CitasAdmin.css";
import "../../styles/MisCitas.css";

const FORM_ACCION = { fecha: "", hora: "", motivo: "" };

const TITULOS = {
  reprogramar: "Reprogramar cita",
  cancelar: "Cancelar cita",
};

const EXITOS = {
  reprogramar: {
    titulo: "Cita reprogramada",
    mensaje: "Tu cita se reprogramó correctamente.",
  },
  cancelar: {
    titulo: "Cita cancelada",
    mensaje: "Tu cita se canceló correctamente.",
  },
};

const ERRORES = {
  reprogramar: "No se pudo reprogramar la cita.",
  cancelar: "No se pudo cancelar la cita.",
};

const datosDe = (res) => res?.payload ?? res?.data ?? res;

const leerUsuario = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

const formatearFecha = (fechaISO = "") =>
  fechaISO ? fechaISO.substring(0, 10).split("-").reverse().join("/") : "";

const formatearHora = (hora) => {
  if (!hora) return "";
  const [h, m] = hora.split(":");
  const horas = parseInt(h, 10);
  const periodo = horas >= 12 ? "PM" : "AM";
  const hora12 = String(horas % 12 || 12).padStart(2, "0");
  return `${hora12}:${m} ${periodo}`;
};

function InicioPaciente() {
  const navigate = useNavigate();
  const fechaMinima = hoyClave();
  const nombre = leerUsuario()?.nombre_usuario;

  const [proximaCita, setProximaCita] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [aviso, setAviso] = useState(null);

  // Una sola modal para reprogramar y cancelar
  const [accion, setAccion] = useState(null); // "reprogramar" | "cancelar" | null
  const [form, setForm] = useState(FORM_ACCION);
  const [horarios, setHorarios] = useState([]);
  const [cargandoHorarios, setCargandoHorarios] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [errorAccion, setErrorAccion] = useState("");

  const cargarProximaCita = async () => {
    try {
      const res = await api("/citas/proximacita");
      setProximaCita(res?.data || null);
    } catch (error) {
      console.error(error);
      setProximaCita(null);
    }
  };

  const cargarHistorial = async () => {
    try {
      const res = await api("/citas/miscitas");
      const data = datosDe(res);
      setHistorial(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setHistorial([]);
    }
  };

  const cargarTodo = async () => {
    await Promise.all([cargarProximaCita(), cargarHistorial()]);
    setCargando(false);
  };

  useEffect(() => {
    cargarTodo();
  }, []);

  // Horarios disponibles al reprogramar
  useEffect(() => {
    const idServicio = proximaCita?.id_servicio;

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
      } catch (error) {
        if (cancelado) return;
        console.error(error);
        setHorarios([]);
        setErrorAccion(error.message || "No se pudieron cargar los horarios.");
      } finally {
        if (!cancelado) setCargandoHorarios(false);
      }
    };

    cargarHorarios();

    return () => {
      cancelado = true;
    };
  }, [accion, form.fecha, proximaCita?.id_servicio]);

  const abrirAccion = (tipo) => {
    setForm(FORM_ACCION);
    setHorarios([]);
    setErrorAccion("");
    setAccion(tipo);
  };

  const cerrarAccion = () => {
    setAccion(null);
    setForm(FORM_ACCION);
    setHorarios([]);
    setErrorAccion("");
  };

  const confirmarAccion = async () => {
    if (!proximaCita || !accion) return;

    const motivo = form.motivo.trim();
    if (!motivo) {
      setErrorAccion(
        accion === "cancelar"
          ? "Escribe el motivo de la cancelación."
          : "Escribe el motivo de la reprogramación."
      );
      return;
    }

    try {
      setProcesando(true);
      setErrorAccion("");

      if (accion === "reprogramar") {
        await api(`/citas/mias/${proximaCita.id_cita}`, "PUT", {
          fecha_agendada: form.fecha,
          hora: form.hora,
          motivo,
        });
      } else {
        await api(`/citas/mias/${proximaCita.id_cita}/cancelar`, "PATCH", {
          motivo,
        });
      }

      const exito = EXITOS[accion];
      cerrarAccion();
      cargarTodo();
      setAviso(exito);
    } catch (error) {
      console.error(error);
      setErrorAccion(error.message || ERRORES[accion]);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="admin-container">
      <Sidebar tipo="paciente" />

      <div className="admin-content">
        <div className="usuarios-container">
          <EncabezadoModulo
            titulo={nombre ? `Bienvenido, ${nombre}` : "Bienvenido"}
            descripcion="Revisa tu próxima cita y el resumen de tus visitas recientes."
            textoBoton="Agendar nueva cita"
            onBoton={() =>
              navigate("/paciente/citaspaciente", { state: { agendar: true } })
            }
          />

          <h2 className="inicio-seccion">Próxima cita</h2>

          {cargando ? (
            <div className="proxima-vacia">
              <p className="proxima-vacia-titulo">Cargando...</p>
            </div>
          ) : proximaCita ? (
            <div className="citas-grid">
              <article className="cita-card">
                <div className="cita-card-top">
                  <h3 className="cita-paciente">{proximaCita.nombre_servicio}</h3>
                  <span className="cita-estado pendiente">pendiente</span>
                </div>

                <div className="cita-datos">
                  <div className="cita-dato">
                    <FaRegCalendarAlt />
                    <span>{formatearFecha(proximaCita.fecha_agendada)}</span>
                  </div>
                  <div className="cita-dato">
                    <FaRegClock />
                    <span>{formatearHora(proximaCita.hora)}</span>
                  </div>
                </div>

                <div className="cita-acciones">
                  <button
                    type="button"
                    className="mf-btn mf-btn-prin"
                    onClick={() => abrirAccion("reprogramar")}
                  >
                    <FaCalendarAlt /> Reprogramar
                  </button>
                  <button
                    type="button"
                    className="mf-btn mf-btn-sec"
                    onClick={() => abrirAccion("cancelar")}
                  >
                    <FaTimesCircle /> Cancelar cita
                  </button>
                </div>
              </article>
            </div>
          ) : (
            <div className="proxima-vacia">
              <span className="proxima-vacia-icono" aria-hidden="true">
                <FaRegCalendarAlt />
              </span>
              <div>
                <p className="proxima-vacia-titulo">
                  No tienes una próxima cita programada.
                </p>
                <p className="proxima-vacia-texto">
                  Cuando agendes una, aparecerá aquí.
                </p>
              </div>
            </div>
          )}

          {proximaCita && (
            <div className="recordatorio-card">
              <span className="recordatorio-icono" aria-hidden="true">
                <FaBell />
              </span>
              <p className="recordatorio-texto">
                No olvides tu cita de <strong>{proximaCita.nombre_servicio}</strong>{" "}
                el <strong>{formatearFecha(proximaCita.fecha_agendada)}</strong> a
                las <strong>{formatearHora(proximaCita.hora)}</strong>.
              </p>
            </div>
          )}

          <section className="agenda-card">
            <div className="agenda-header">
              <div>
                <h2 className="agenda-titulo">Historial de citas recientes</h2>
                
              </div>

              <button
                type="button"
                className="inicio-ver-todas"
                onClick={() => navigate("/paciente/citaspaciente")}
              >
                Ver todas
              </button>
            </div>

            {cargando ? (
              <p className="usuarios-vacio">Cargando...</p>
            ) : historial.length === 0 ? (
              <p className="usuarios-vacio">No tienes citas registradas.</p>
            ) : (
              <ul className="agenda-lista">
                {historial.slice(0, 3).map((cita) => {
                  const estado = (cita.estado || "").toLowerCase();

                  return (
                    <li key={cita.id} className="agenda-item historial-item">
                      <span className="agenda-hora historial-fecha">
                        {formatearFecha(cita.fecha_agendada)}
                      </span>

                      <div className="agenda-info">
                        <p className="agenda-paciente">{cita.nombre_servicio}</p>
                        <p className="agenda-servicio">{formatearHora(cita.hora)}</p>
                      </div>

                      <span className={`cita-estado ${estado}`}>
                        {estado || "Sin estado"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>

      {/* Reprogramar / cancelar */}
      <ModalFormulario
        abierto={!!accion}
        titulo={TITULOS[accion] || ""}
        subtitulo={
          proximaCita
            ? `${proximaCita.nombre_servicio} · ${formatearFecha(
                proximaCita.fecha_agendada
              )} · ${formatearHora(proximaCita.hora)}`
            : ""
        }
        onCerrar={cerrarAccion}
        onSubmit={confirmarAccion}
        enviando={procesando}
        error={errorAccion}
        textoEnviar={accion === "cancelar" ? "Cancelar cita" : "Reprogramar"}
        textoEnviando="Procesando..."
        textoCancelar={accion === "cancelar" ? "Volver" : "Cancelar"}
        peligro={accion === "cancelar"}
        ancho={500}
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

      <ModalConfirmacion
        abierto={!!aviso}
        titulo={aviso?.titulo}
        mensaje={aviso?.mensaje}
        textoCancelar={null}
        textoConfirmar="Aceptar"
        onConfirmar={() => setAviso(null)}
      />
    </div>
  );
}

export default InicioPaciente;