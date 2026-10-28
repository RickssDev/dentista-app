import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaRegCalendarAlt,
  FaRegClock,
  FaCommentDots,
  FaCheckCircle,
  FaStar,
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

const FORM_CITA_VACIO = { id_servicio: "", fecha: "", hora: "" };
const FORM_COMENTARIO_VACIO = { calificacion: 0, comentario: "" };

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

function CitasPaciente() {
  const fechaMinima = hoyClave();
  const location = useLocation();
  const navigate = useNavigate();

  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [servicios, setServicios] = useState([]);
  const [aviso, setAviso] = useState(null);

  // Agendar nueva cita
  const [mostrarAgendar, setMostrarAgendar] = useState(false);
  const [form, setForm] = useState(FORM_CITA_VACIO);
  const [horarios, setHorarios] = useState([]);
  const [cargandoHorarios, setCargandoHorarios] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorAgendar, setErrorAgendar] = useState("");

  // Dejar comentario
  const [citaComentar, setCitaComentar] = useState(null);
  const [formComentario, setFormComentario] = useState(FORM_COMENTARIO_VACIO);
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const [errorComentario, setErrorComentario] = useState("");

  const mostrarAviso = (titulo, mensaje) => setAviso({ titulo, mensaje });

  const cargarCitas = async () => {
    try {
      const res = await api("/citas/miscitas");
      const data = res?.payload ?? res?.data ?? res;
      setCitas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setCitas([]);
      mostrarAviso(
        "No se pudieron cargar tus citas",
        error.message || "Intenta de nuevo más tarde."
      );
    } finally {
      setCargando(false);
    }
  };

  const cargarServicios = async () => {
    try {
      const res = await api("/servicios/publicos");
      const data = res?.payload ?? res?.data ?? res;
      setServicios(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setServicios([]);
    }
  };

  useEffect(() => {
    cargarCitas();
    cargarServicios();
  }, []);

  // Horarios disponibles según la fecha y el servicio elegidos
  useEffect(() => {
    if (!mostrarAgendar || !form.fecha || !form.id_servicio) {
      setHorarios([]);
      return;
    }

    let cancelado = false;

    const cargarHorarios = async () => {
      try {
        setCargandoHorarios(true);
        const res = await api(
          `/citas/horarios-disponibles?fecha=${form.fecha}&id_servicio=${form.id_servicio}`
        );
        const data = res?.payload ?? res?.data ?? res;
        if (!cancelado) setHorarios(Array.isArray(data) ? data : []);
      } catch (error) {
        if (cancelado) return;
        console.error(error);
        setHorarios([]);
        setErrorAgendar(error.message || "No se pudieron cargar los horarios");
      } finally {
        if (!cancelado) setCargandoHorarios(false);
      }
    };

    cargarHorarios();

    return () => {
      cancelado = true;
    };
  }, [mostrarAgendar, form.fecha, form.id_servicio]);

  const abrirAgendar = () => {
    setForm(FORM_CITA_VACIO);
    setHorarios([]);
    setErrorAgendar("");
    setMostrarAgendar(true);
  };

  // Llegar desde "Agendar nueva cita" en Inicio abre el modal directamente
  useEffect(() => {
    if (location.state?.agendar) {
      abrirAgendar();
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state]);

  const cerrarAgendar = () => {
    setMostrarAgendar(false);
    setForm(FORM_CITA_VACIO);
    setHorarios([]);
    setErrorAgendar("");
  };

  const agendarCita = async () => {
    try {
      setGuardando(true);
      setErrorAgendar("");

      await api("/citas/paciente", "POST", {
        fecha_agendada: form.fecha,
        hora: form.hora,
        id_servicio: Number(form.id_servicio),
      });

      cerrarAgendar();
      cargarCitas();
      mostrarAviso("Cita agendada", "Tu cita se agendó correctamente.");
    } catch (error) {
      console.error(error);
      setErrorAgendar(error.message || "No se pudo agendar la cita.");
    } finally {
      setGuardando(false);
    }
  };

  const abrirComentario = (cita) => {
    setFormComentario(FORM_COMENTARIO_VACIO);
    setErrorComentario("");
    setCitaComentar(cita);
  };

  const cerrarComentario = () => {
    setCitaComentar(null);
    setFormComentario(FORM_COMENTARIO_VACIO);
    setErrorComentario("");
  };

  // Una cita reseñada ya no vuelve a ofrecer el botón (aprobada, pendiente o eliminada)
  const marcarComentada = (idCita) =>
    setCitas((actuales) =>
      actuales.map((cita) =>
        cita.id === idCita ? { ...cita, comentado: true } : cita
      )
    );

  const enviarComentario = async () => {
    if (!formComentario.calificacion) {
      setErrorComentario("Elige una calificación de 1 a 5 estrellas.");
      return;
    }

    const texto = formComentario.comentario.trim();
    if (!texto) {
      setErrorComentario("Escribe tu comentario.");
      return;
    }

    try {
      setEnviandoComentario(true);
      setErrorComentario("");

      await api("/comentarios", "POST", {
        id_cita: citaComentar.id,
        calificacion: formComentario.calificacion,
        comentario: texto,
      });

      marcarComentada(citaComentar.id);
      cerrarComentario();
      mostrarAviso(
        "¡Gracias por tu comentario!",
        "Lo recibimos y se publicará en el sitio cuando la clínica lo revise."
      );
    } catch (error) {
      console.error(error);
      const mensaje = error.message || "No se pudo enviar el comentario.";

      // Si la cita ya tenía reseña, deja de ofrecer el botón
      if (/ya tiene una rese/i.test(mensaje)) {
        marcarComentada(citaComentar.id);
        cerrarComentario();
      } else {
        setErrorComentario(mensaje);
      }
    } finally {
      setEnviandoComentario(false);
    }
  };

  return (
    <div className="admin-container">
      <Sidebar tipo="paciente" />

      <div className="admin-content">
        <div className="citas-container">
          <EncabezadoModulo
            titulo="Mis citas"
            descripcion="Consulta tus citas y agenda una nueva cuando lo necesites."
            textoBoton="Agendar nueva cita"
            onBoton={abrirAgendar}
          />

          {cargando ? (
            <p className="usuarios-vacio">Cargando tus citas...</p>
          ) : citas.length === 0 ? (
            <p className="usuarios-vacio">
              Aún no tienes citas. Agenda la primera cuando quieras.
            </p>
          ) : (
            <div className="citas-grid">
              {citas.map((cita) => {
                const estado = (cita.estado || "").toLowerCase();

                return (
                  <article key={cita.id} className="cita-card">
                    <div className="cita-card-top">
                      <h3 className="cita-paciente">{cita.nombre_servicio}</h3>
                      <span className={`cita-estado ${estado}`}>
                        {estado || "Sin estado"}
                      </span>
                    </div>

                    <div className="cita-datos">
                      <div className="cita-dato">
                        <FaRegCalendarAlt />
                        <span>{formatearFecha(cita.fecha_agendada)}</span>
                      </div>
                      <div className="cita-dato">
                        <FaRegClock />
                        <span>{formatearHora(cita.hora)}</span>
                      </div>
                    </div>

                    {estado === "completada" && (
                      <div className="cita-acciones">
                        {cita.comentado ? (
                          <div className="comentario-respondido">
                            <FaCheckCircle /> Comentario enviado
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="btn-card-edit cita-comentar"
                            onClick={() => abrirComentario(cita)}
                          >
                            <FaCommentDots /> Dejar comentario
                          </button>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Agendar nueva cita */}
      <ModalFormulario
        abierto={mostrarAgendar}
        titulo="Agendar nueva cita"
        subtitulo="Elige el servicio, la fecha y el horario que prefieras."
        onCerrar={cerrarAgendar}
        onSubmit={agendarCita}
        enviando={guardando}
        error={errorAgendar}
        textoEnviar="Agendar cita"
        textoEnviando="Agendando..."
        ancho={560}
      >
        <div className="mf-grid">
          <label className="mf-campo mf-ancho">
            <span>Servicio</span>
            <select
              value={form.id_servicio}
              onChange={(e) =>
                setForm({ ...form, id_servicio: e.target.value, hora: "" })
              }
              required
            >
              <option value="">Seleccionar servicio</option>
              {servicios.map((servicio) => (
                <option key={servicio.id} value={servicio.id}>
                  {servicio.nombre}
                </option>
              ))}
            </select>
          </label>

          <label className="mf-campo">
            <span>Fecha</span>
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
            <span>Hora</span>
            <select
              value={form.hora}
              onChange={(e) => setForm({ ...form, hora: e.target.value })}
              disabled={!form.fecha || !form.id_servicio || cargandoHorarios}
              required
            >
              <option value="">
                {!form.fecha
                  ? "Primero selecciona una fecha"
                  : !form.id_servicio
                    ? "Primero selecciona un servicio"
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
        </div>
      </ModalFormulario>

      {/* Dejar comentario */}
      <ModalFormulario
        abierto={!!citaComentar}
        titulo="Dejar un comentario"
        subtitulo={
          citaComentar
            ? `${citaComentar.nombre_servicio} · ${formatearFecha(
                citaComentar.fecha_agendada
              )}`
            : ""
        }
        onCerrar={cerrarComentario}
        onSubmit={enviarComentario}
        enviando={enviandoComentario}
        error={errorComentario}
        textoEnviar="Enviar comentario"
        textoEnviando="Enviando..."
        ancho={500}
      >
        <div className="mf-campo">
          <span id="etiqueta-calificacion">Calificación</span>
          <div
            className="estrellas-input"
            role="radiogroup"
            aria-labelledby="etiqueta-calificacion"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={formComentario.calificacion === n}
                aria-label={`${n} ${n === 1 ? "estrella" : "estrellas"}`}
                className={`estrella-btn${
                  n <= formComentario.calificacion ? " llena" : ""
                }`}
                onClick={() =>
                  setFormComentario({ ...formComentario, calificacion: n })
                }
              >
                <FaStar />
              </button>
            ))}
          </div>
        </div>

        <label className="mf-campo">
          <span>Tu comentario</span>
          <textarea
            rows={4}
            placeholder="Cuéntanos cómo fue tu experiencia"
            value={formComentario.comentario}
            onChange={(e) =>
              setFormComentario({ ...formComentario, comentario: e.target.value })
            }
            required
          />
        </label>

        <p className="mf-mensaje">
          Tu comentario se publicará en el sitio cuando la clínica lo revise.
        </p>
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

export default CitasPaciente;