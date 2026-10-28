import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/adminpanel.css";
import {
  FaPlus,
  FaBook,
  FaUserPlus,
  FaComments,
  FaChartBar,
  FaCheckCircle,
  FaTimesCircle,
  FaCalendarAlt,
  FaSyncAlt,
  FaChevronRight,
} from "react-icons/fa";
import { api, getImageUrl } from "../../services/api";
import EncabezadoModulo from "../../components/EncabezadoModulo";
import ModalConfirmacion from "../../components/ModalConfirmacion";
import ModalFormulario from "../../components/ModalFormulario";

const RUTA = "/admin";

const RESUMEN_VACIO = {
  estadisticas: {
    citasHoy: 0,
    citasProximas: 0,
    pacientesNuevos: 0,
    comentariosPendientes: 0,
  },
  agendaHoy: [],
};

const TARJETAS = [
  { key: "citasHoy", label: "Citas del día" },
  { key: "citasProximas", label: "Citas próximas" },
  { key: "pacientesNuevos", label: "Pacientes nuevos" },
];

const ACCIONES = [
  {
    key: "crear-cita",
    label: "Crear cita",
    descripcion: "Agenda una nueva cita",
    icono: <FaPlus />,
    destacada: true,
  },
  {
    key: "ver-agenda",
    label: "Ver agenda",
    descripcion: "Abre el calendario de citas",
    icono: <FaBook />,
    ruta: "citas",
    state: { vista: "calendario" },
  },

  {
    key: "agregar-paciente",
    label: "Agregar paciente",
    descripcion: "Registra un nuevo paciente",
    icono: <FaUserPlus />,
    color: "verde",
  },
  {
    key: "comentarios",
    label: "Comentarios pendientes",
    descripcion: "Modera las opiniones",
    icono: <FaComments />,
    color: "ambar",
    ruta: "comentarios",
    state: { filtroEstado: "oculto" },
    badge: "comentariosPendientes",
  },
];
const TITULOS = {
  reprogramar: "Reprogramar cita",
  cancelar: "Cancelar cita",
  finalizar: "Finalizar cita",
};

const EXITOS = {
  reprogramar: {
    titulo: "Cita reprogramada",
    mensaje: "La cita se reprogramó correctamente.",
  },
  cancelar: {
    titulo: "Cita cancelada",
    mensaje: "La cita se canceló correctamente.",
  },
  finalizar: {
    titulo: "Cita finalizada",
    mensaje: "La cita se finalizó correctamente.",
  },
};

const ERRORES = {
  reprogramar: "No se pudo reprogramar la cita",
  cancelar: "No se pudo cancelar la cita",
  finalizar: "No se pudo finalizar la cita",
};

const FORM_ACCION = {
  nuevaFecha: "",
  nuevaHora: "",
  motivo: "",
  diagnostico: "",
  observaciones: "",
};

const formatHora = (hora) => {
  if (!hora) return "";

  const [h, m] = hora.split(":");
  const horas = Number(h);
  const periodo = horas >= 12 ? "PM" : "AM";
  const h12 = String(horas % 12 || 12).padStart(2, "0");

  return `${h12}:${m} ${periodo}`;
};

const leerUsuario = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

/* Foto del usuario; si no hay (o falla la carga) muestra su inicial */
function AvatarUsuario({ usuario }) {
  const [falloImagen, setFalloImagen] = useState(false);
  const inicial = (usuario?.nombre_usuario || "?").charAt(0).toUpperCase();

  return (
    <div className="inicio-avatar">
      {usuario?.imagen && !falloImagen ? (
        <img
          src={getImageUrl(usuario.imagen)}
          alt="Foto de perfil"
          onError={() => setFalloImagen(true)}
        />
      ) : (
        inicial
      )}
    </div>
  );
}

function AdminInicio({ onCrearCita, onAgregarPaciente, recargar = 0 }) {
  const navigate = useNavigate();
  const usuario = leerUsuario();

  const [resumen, setResumen] = useState(RESUMEN_VACIO);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Una sola modal para reprogramar, cancelar y finalizar
  const [accion, setAccion] = useState(null); // { tipo, cita }
  const [form, setForm] = useState(FORM_ACCION);
  const [horarios, setHorarios] = useState([]);
  const [errorAccion, setErrorAccion] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [aviso, setAviso] = useState(null);

  const obtenerResumen = useCallback(async () => {
    try {
      const data = await api("/dashboard/resumen");
      setResumen(data.payload);
      setError("");
    } catch (err) {
      console.error(err);
      setError(err.message || "No se pudo cargar el resumen");
    } finally {
      setCargando(false);
    }
  }, []);

  // Al abrir y cada vez que el layout avisa que algo cambió (cita o paciente creado)
  useEffect(() => {
    obtenerResumen();
  }, [obtenerResumen, recargar]);

  // Horarios disponibles al reprogramar
  useEffect(() => {
    if (accion?.tipo !== "reprogramar" || !form.nuevaFecha) {
      setHorarios([]);
      return;
    }

    const servicioId = accion.cita.id_servicio ?? accion.cita.id_servicio_cita;

    if (!servicioId) {
      setHorarios([]);
      return;
    }

    let cancelado = false;

    const cargarHorarios = async () => {
      try {
        const respuesta = await api(
          `/citas/horarios-disponibles?fecha=${form.nuevaFecha}&id_servicio=${servicioId}`,
        );
        const data = respuesta?.payload ?? respuesta?.data ?? respuesta;
        if (!cancelado) setHorarios(Array.isArray(data) ? data : []);
      } catch (err) {
        if (cancelado) return;
        console.error(err);
        setHorarios([]);
        setErrorAccion(err.message || "No se pudieron cargar los horarios");
      }
    };

    cargarHorarios();

    return () => {
      cancelado = true;
    };
  }, [accion, form.nuevaFecha]);

  const ir = (ruta, state) => {
    navigate(`${RUTA}/${ruta}`, { state });
  };

  const ejecutarAccion = (a) => {
    if (a.key === "crear-cita") return onCrearCita();
    if (a.key === "agregar-paciente") return onAgregarPaciente();
    ir(a.ruta, a.state);
  };

  const abrirAccion = (tipo, cita) => {
    setAccion({ tipo, cita });
    setForm({ ...FORM_ACCION });
    setHorarios([]);
    setErrorAccion("");
  };

  const cerrarAccion = () => {
    setAccion(null);
    setForm({ ...FORM_ACCION });
    setHorarios([]);
    setErrorAccion("");
  };

  const cambiarCampo = (campo) => (e) =>
    setForm({ ...form, [campo]: e.target.value });

  const validarAccion = () => {
    const { tipo } = accion;

    if (tipo === "cancelar" && !form.motivo.trim()) {
      return "Ingresa el motivo de la cancelación.";
    }
    if (
      tipo === "reprogramar" &&
      (!form.nuevaFecha || !form.nuevaHora || !form.motivo.trim())
    ) {
      return "Completa la fecha, hora y motivo de la reprogramación.";
    }
    if (
      tipo === "finalizar" &&
      (!form.diagnostico.trim() || !form.observaciones.trim())
    ) {
      return "Ingresa el diagnóstico y las observaciones.";
    }
    return "";
  };

  const confirmarAccion = async () => {
    const mensajeError = validarAccion();
    if (mensajeError) {
      setErrorAccion(mensajeError);
      return;
    }

    const { tipo, cita } = accion;

    try {
      setProcesando(true);
      setErrorAccion("");

      if (tipo === "cancelar") {
        await api(`/citas/${cita.id_cita}/cancelar`, "PATCH", {
          motivo: form.motivo.trim(),
        });
      }

      if (tipo === "reprogramar") {
        await api(`/citas/${cita.id_cita}`, "PUT", {
          fecha_agendada: form.nuevaFecha,
          hora: form.nuevaHora,
          motivo: form.motivo.trim(),
        });
      }

      if (tipo === "finalizar") {
        await api(`/historial/finalizar-cita/${cita.id_cita}`, "POST", {
          diagnostico: form.diagnostico.trim(),
          observaciones: form.observaciones.trim(),
        });
      }

      cerrarAccion();
      obtenerResumen();
      setAviso(EXITOS[tipo]);
    } catch (err) {
      console.error(err);
      setErrorAccion(err.message || ERRORES[tipo]);
    } finally {
      setProcesando(false);
    }
  };

  const { estadisticas, agendaHoy } = resumen;

  const fechaHoyTexto = new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="usuarios-container">
      <EncabezadoModulo
        titulo="Panel de control"
        descripcion="Resumen de la actividad de la clínica hoy."
        acciones={
          usuario && (
            <div className="inicio-usuario">
              <AvatarUsuario usuario={usuario} />
              <div>
                <p className="inicio-usuario-nombre">
                  {usuario.nombre_usuario}
                </p>
                {usuario.rol && (
                  <p className="inicio-usuario-rol">{usuario.rol}</p>
                )}
              </div>
            </div>
          )
        }
      />

      {error && <p className="mensaje-error">{error}</p>}

      <div className="inicio-stats">
        {TARJETAS.map((tarjeta) => (
          <div key={tarjeta.key} className="inicio-stat">
            <span className="inicio-stat-numero">
              {cargando ? "–" : estadisticas[tarjeta.key]}
            </span>
            <span className="inicio-stat-label">{tarjeta.label}</span>
          </div>
        ))}
      </div>

      <h2 className="inicio-seccion">Accesos rápidos</h2>

      <div className="inicio-acciones">
        {ACCIONES.map((a) => (
          <button
            key={a.key}
            type="button"
            className={`inicio-accion${a.color ? ` ${a.color}` : ""}${a.destacada ? " destacada" : ""}`}
            onClick={() => ejecutarAccion(a)}
          >
            <span className="inicio-accion-icono">{a.icono}</span>

            <span className="inicio-accion-texto">
              <span className="inicio-accion-titulo">{a.label}</span>
              <span className="inicio-accion-desc">{a.descripcion}</span>
            </span>

            {a.badge && estadisticas[a.badge] > 0 && (
              <span className="inicio-accion-badge">
                {estadisticas[a.badge]}
              </span>
            )}

            <FaChevronRight className="inicio-accion-flecha" />
          </button>
        ))}
      </div>

      <section className="agenda-card">
        <div className="agenda-header">
          <div>
            <h2 className="agenda-titulo">Próximas citas de hoy</h2>
            <p className="agenda-fecha">{fechaHoyTexto}</p>
          </div>

          <button
            type="button"
            className="agenda-actualizar"
            title="Actualizar"
            aria-label="Actualizar agenda"
            onClick={obtenerResumen}
          >
            <FaSyncAlt />
          </button>
        </div>

        {agendaHoy.length === 0 ? (
          <p className="usuarios-vacio">
            {cargando ? "Cargando..." : "No hay citas pendientes para hoy."}
          </p>
        ) : (
          <ul className="agenda-lista">
            {agendaHoy.map((cita) => (
              <li key={cita.id_cita} className="agenda-item">
                <span className="agenda-hora">{formatHora(cita.hora)}</span>

                <div className="agenda-info">
                  <p className="agenda-paciente">
                    {cita.nombre_usuario} {cita.apellido}
                  </p>
                  <p className="agenda-servicio">{cita.nombre_servicio}</p>
                </div>

                <div className="agenda-acciones">
                  <button
                    type="button"
                    className="agenda-btn reprogramar"
                    title="Reprogramar cita"
                    aria-label="Reprogramar cita"
                    onClick={() => abrirAccion("reprogramar", cita)}
                  >
                    <FaCalendarAlt />
                  </button>
                  <button
                    type="button"
                    className="agenda-btn finalizar"
                    title="Finalizar cita"
                    aria-label="Finalizar cita"
                    onClick={() => abrirAccion("finalizar", cita)}
                  >
                    <FaCheckCircle />
                  </button>
                  <button
                    type="button"
                    className="agenda-btn cancelar"
                    title="Cancelar cita"
                    aria-label="Cancelar cita"
                    onClick={() => abrirAccion("cancelar", cita)}
                  >
                    <FaTimesCircle />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ModalFormulario
        abierto={!!accion}
        titulo={TITULOS[accion?.tipo] || ""}
        subtitulo={
          accion?.cita
            ? `${accion.cita.nombre_usuario} ${accion.cita.apellido} · ${formatHora(
                accion.cita.hora,
              )}`
            : ""
        }
        onCerrar={cerrarAccion}
        onSubmit={confirmarAccion}
        enviando={procesando}
        error={errorAccion}
        textoEnviar={procesando ? "Procesando..." : "Confirmar"}
        textoCancelar={accion?.tipo === "cancelar" ? "Volver" : "Cancelar"}
        peligro={accion?.tipo === "cancelar"}
        ancho={500}
      >
        {accion?.tipo === "reprogramar" && (
          <div className="mf-grid">
            <label className="mf-campo">
              <span>Nueva fecha</span>
              <input
                type="date"
                min={new Date().toLocaleDateString("en-CA")}
                value={form.nuevaFecha}
                onChange={(e) =>
                  setForm({
                    ...form,
                    nuevaFecha: e.target.value,
                    nuevaHora: "",
                  })
                }
                required
              />
            </label>

            <label className="mf-campo">
              <span>Nueva hora</span>
              <select
                value={form.nuevaHora}
                onChange={cambiarCampo("nuevaHora")}
                disabled={!form.nuevaFecha || horarios.length === 0}
                required
              >
                <option value="">
                  {!form.nuevaFecha
                    ? "Primero selecciona una fecha"
                    : horarios.length === 0
                      ? "No hay horarios disponibles"
                      : "Selecciona un horario"}
                </option>

                {horarios.map((horario) => (
                  <option key={horario} value={horario}>
                    {horario}
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
                onChange={cambiarCampo("motivo")}
                required
              />
            </label>
          </div>
        )}

        {accion?.tipo === "cancelar" && (
          <label className="mf-campo mf-ancho">
            <span>Motivo</span>
            <textarea
              rows={3}
              placeholder="Motivo de la cancelación"
              value={form.motivo}
              onChange={cambiarCampo("motivo")}
              required
            />
          </label>
        )}

        {accion?.tipo === "finalizar" && (
          <div className="mf-grid">
            <label className="mf-campo mf-ancho">
              <span>Diagnóstico</span>
              <textarea
                rows={3}
                placeholder="Diagnóstico"
                value={form.diagnostico}
                onChange={cambiarCampo("diagnostico")}
                required
              />
            </label>

            <label className="mf-campo mf-ancho">
              <span>Observaciones</span>
              <textarea
                rows={3}
                placeholder="Observaciones"
                value={form.observaciones}
                onChange={cambiarCampo("observaciones")}
                required
              />
            </label>
          </div>
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

export default AdminInicio;
