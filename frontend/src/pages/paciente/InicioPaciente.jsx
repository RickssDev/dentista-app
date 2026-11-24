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
import ModalAccionCita from "../../components/ModalAccionCita";
import { EXITOS_ACCION_CITA } from "../../utils/avisosCita";
import ModalConfirmacion from "../../components/ModalConfirmacion";
import { api } from "../../services/api";
import "../../styles/adminpanel.css";
import "../../styles/CitasAdmin.css";
import "../../styles/MisCitas.css";

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
  const nombre = leerUsuario()?.nombre_usuario;

  const [proximaCita, setProximaCita] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [aviso, setAviso] = useState(null);

  // Una sola modal para reprogramar y cancelar
  const [accion, setAccion] = useState(null); // "reprogramar" | "cancelar" | null

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
    // La carga corre fuera del cuerpo del efecto (las actualizaciones llegan tras la respuesta)
    Promise.resolve().then(cargarTodo);
  }, []);

  const abrirAccion = (tipo) => setAccion(tipo);

  const cerrarAccion = () => setAccion(null);

  const alHecho = (tipo) => {
    setAccion(null);
    cargarTodo();
    setAviso(EXITOS_ACCION_CITA[tipo]);
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

          <h2 className="inicio-seccion">Próxima cita</h2>

          {cargando ? (
            <div className="proxima-vacia">
              <p className="proxima-vacia-titulo">Cargando...</p>
            </div>
          ) : proximaCita ? (
            <div className="proxima-cita">
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
      <ModalAccionCita
        cita={proximaCita ? { ...proximaCita, id: proximaCita.id_cita } : null}
        subtitulo={
          proximaCita
            ? `${proximaCita.nombre_servicio} · ${formatearFecha(
                proximaCita.fecha_agendada
              )} · ${formatearHora(proximaCita.hora)}`
            : ""
        }
        accion={accion}
        ancho={500}
        onCerrar={cerrarAccion}
        onHecho={alHecho}
      />

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