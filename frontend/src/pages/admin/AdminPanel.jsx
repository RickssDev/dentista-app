import { useEffect, useState } from "react";
import { useNavigate, Routes, Route} from "react-router-dom";
import "../../styles/AdminPanel.css";

import {
  FaPlus,
  FaBook,
  FaUserPlus,
  FaComments,
  FaChartBar,
  FaCheckCircle,
  FaTimesCircle,
  FaCalendarAlt,
} from "react-icons/fa";

import { api } from "../../services/api";
import Sidebar from "../../components/sidebar";

import AdminUsuarios from "./AdminUsuarios";
import AdminServicios from "./AdminServicios";
import AdminHistorial from "./AdminHistorial";
import AdminPromociones from "./AdminPromociones";
import CitasAdmin from "./CitasAdmin";
import AdminHistorialPaciente from "./AdminHPaciente";
import AdminComentarios from "./AdminComentarios";
import AdminFaqs from "./Adminfaqs";
import AdminImagenes from "./Admingaleria";
import AdminReportes from "./Adminreportes";

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
  {
    key: "citasHoy",
    label: "Citas del día",
    ruta: "citas",
    state: { soloHoy: true },
  },
  {
    key: "citasProximas",
    label: "Citas próximas",
    ruta: "citas",
    state: null,
  },
  {
    key: "pacientesNuevos",
    label: "Pacientes nuevos",
    ruta: "usuarios",
    state: null,
  },
];

const ACCIONES = [
  {
    key: "crear-cita",
    label: "Crear cita",
    icono: <FaPlus />,
    ruta: "citas",
    state: { nuevaCita: true },
  },
  {
    key: "ver-agenda",
    label: "Ver agenda",
    icono: <FaBook />,
    ruta: "citas",
    state: { soloHoy: true },
  },
  {
    key: "agregar-paciente",
    label: "Agregar paciente",
    icono: <FaUserPlus />,
    ruta: "usuarios",
    state: { nuevoPaciente: true },
  },
  {
    key: "comentarios",
    label: "Comentarios pendientes",
    icono: <FaComments />,
    ruta: "comentarios",
    state: { tab: "oculto" },
    badge: "comentariosPendientes",
  },
  {
    key: "reporte",
    label: "Generar reporte",
    icono: <FaChartBar />,
    ruta: "reportes",
    state: null,
  },
];

const formatHora = (hora) => {
  if (!hora) return "";

  const [h, m] = hora.split(":");
  const horas = Number(h);
  const periodo = horas >= 12 ? "PM" : "AM";
  const h12 = String(horas % 12 || 12).padStart(2, "0");

  return `${h12}:${m} ${periodo}`;
};

function AdminInicio({ onCrearCita, onAgregarPaciente }) {
  const navigate = useNavigate();

  const usuario = JSON.parse(localStorage.getItem("user") || "null");

  const [resumen, setResumen] = useState(RESUMEN_VACIO);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [citaParaFinalizar, setCitaParaFinalizar] = useState(null);
  const [diagnostico, setDiagnostico] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [mostrarModalFinalizar, setMostrarModalFinalizar] = useState(false);
  const [citaParaCancelar, setCitaParaCancelar] = useState(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState("");
  const [mostrarModalCancelar, setMostrarModalCancelar] = useState(false);

  const [citaParaReprogramar, setCitaParaReprogramar] = useState(null);
  const [nuevaFecha, setNuevaFecha] = useState("");
  const [nuevaHora, setNuevaHora] = useState("");
  const [motivoReprogramacion, setMotivoReprogramacion] = useState("");
  const [horariosDisponibles, setHorariosDisponibles] = useState([]);
  const [mostrarModalReprogramar, setMostrarModalReprogramar] = useState(false);

  const obtenerResumen = async () => {
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
  };

  useEffect(() => {
    obtenerResumen();
  }, []);

  useEffect(() => {
  if (mostrarModalReprogramar && nuevaFecha) {
    obtenerHorariosDisponibles();
  }
}, [mostrarModalReprogramar, nuevaFecha, citaParaReprogramar]);

  const ir = (ruta, state) => {
    navigate(`${RUTA}/${ruta}`, { state });
  };

  
const ejecutarAccion = (accion) => {
  if (accion.key === "crear-cita") {
    onCrearCita();
    return;
  }

  if (accion.key === "agregar-paciente") {
    onAgregarPaciente();
    return;
  }

  ir(accion.ruta, accion.state);
};


 
const abrirModalFinalizar = (cita) => {
  setCitaParaFinalizar(cita);
  setDiagnostico("");
  setObservaciones("");
  setMostrarModalFinalizar(true);
};

const abrirModalCancelar = (cita) => {
  setCitaParaCancelar(cita);
  setMotivoCancelacion("");
  setMostrarModalCancelar(true);
};

const abrirModalReprogramar = (cita) => {
  setCitaParaReprogramar(cita);
  setNuevaFecha("");
  setNuevaHora("");
  setMotivoReprogramacion("");
  setHorariosDisponibles([]);
  setMostrarModalReprogramar(true);
};


const confirmarCancelacion = async () => {
  if (!citaParaCancelar || !motivoCancelacion.trim()) {
    alert("Ingresa el motivo de la cancelación.");
    return;
  }

  try {
    await api(`/citas/${citaParaCancelar.id_cita}/cancelar`, "PATCH", {
      motivo: motivoCancelacion.trim(),
    });

    setMostrarModalCancelar(false);
    setCitaParaCancelar(null);
    setMotivoCancelacion("");
    obtenerResumen();
  } catch (err) {
    console.error(err);
    alert(err.message || "No se pudo cancelar la cita");
  }
};

const confirmarReprogramacion = async () => {
  if (
    !citaParaReprogramar ||
    !nuevaFecha ||
    !nuevaHora ||
    !motivoReprogramacion.trim()
  ) {
    alert("Completa la fecha, hora y motivo de la reprogramación.");
    return;
  }

  try {
    await api(`/citas/${citaParaReprogramar.id_cita}`, "PUT", {
      fecha_agendada: nuevaFecha,
      hora: nuevaHora,
      motivo: motivoReprogramacion.trim(),
    });

    setMostrarModalReprogramar(false);
    setCitaParaReprogramar(null);
    setNuevaFecha("");
    setNuevaHora("");
    setMotivoReprogramacion("");
    setHorariosDisponibles([]);
    obtenerResumen();
  } catch (err) {
    console.error(err);
    alert(err.message || "No se pudo reprogramar la cita");
  }
};

const obtenerHorariosDisponibles = async () => {
  if (!nuevaFecha || !citaParaReprogramar) {
    setHorariosDisponibles([]);
    setNuevaHora("");
    return;
  }

  try {
    const servicioId =
      citaParaReprogramar.id_servicio ??
      citaParaReprogramar.id_servicio_cita;

    if (!servicioId) {
      setHorariosDisponibles([]);
      return;
    }

    const respuesta = await api(
      `/citas/horarios-disponibles?fecha=${nuevaFecha}&id_servicio=${servicioId}`
    );

    const data = respuesta?.payload ?? respuesta?.data ?? respuesta;
    setHorariosDisponibles(Array.isArray(data) ? data : []);
    setNuevaHora("");
  } catch (err) {
    console.error(err);
    setHorariosDisponibles([]);
    setNuevaHora("");
    alert(err.message || "No se pudieron cargar los horarios");
  }
};

const completarCita = async () => {
  if (!citaParaFinalizar) return;

  if (!diagnostico.trim() || !observaciones.trim()) {
    alert("Ingresa el diagnóstico y las observaciones.");
    return;
  }

  try {
    await api(
      `/historial/finalizar-cita/${citaParaFinalizar.id_cita}`,
      "POST",
      {
        diagnostico: diagnostico.trim(),
        observaciones: observaciones.trim(),
      }
    );

    alert("Cita finalizada correctamente");

    setMostrarModalFinalizar(false);
    setCitaParaFinalizar(null);
    setDiagnostico("");
    setObservaciones("");

    obtenerResumen();
  } catch (err) {
    console.error(err);
    alert(err.message || "No se pudo finalizar la cita");
  }
};


  const cancelarCita = async (id) => {
    const motivo = prompt("Motivo de la cancelación:");

    if (!motivo || !motivo.trim()) return;

    try {
      await api(`/citas/${id}/cancelar`, "PATCH", {
        motivo: motivo.trim(),
      });

      obtenerResumen();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const { estadisticas, agendaHoy } = resumen;

  return (
    <>
      

<div className="topbar">
  <h2>Administrador</h2>

  <div className="user">
    <div className="avatar">
      {usuario?.imagen ? (
        <img
          src={`http://localhost:3000${usuario.imagen}`}
          alt="Foto de perfil"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ) : (
        <span>
          {usuario?.nombre_usuario?.charAt(0).toUpperCase()}
        </span>
      )}
    </div>

    <span>{usuario?.nombre_usuario}</span>
  </div>
</div>



      <h1 className="panel-title">Panel de control</h1>

      {error && <p className="dashboard-error">{error}</p>}

      <div className="stats">
        {TARJETAS.map((tarjeta) => (
          <div key={tarjeta.key} className="stat-card">
            <p>{tarjeta.label}</p>
            <h2>
              {cargando ? "–" : estadisticas[tarjeta.key]}
            </h2>
          </div>
        ))}
      </div>

      <div className="actions">
        {ACCIONES.map((accion) => (
          <div
            key={accion.key}
            className="action-card"
            onClick={() => ejecutarAccion(accion)}
          >
            {accion.badge &&
              estadisticas[accion.badge] > 0 && (
                <span className="action-badge">
                  {estadisticas[accion.badge]}
                </span>
              )}

            {accion.icono}
            <p>{accion.label}</p>
          </div>
        ))}
      </div>

      <div className="table-container">
        <h2>Próximas citas de hoy</h2>

        <table>
          <thead>
            <tr>
              <th>Hora</th>
              <th>Paciente</th>
              <th>Servicio</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {agendaHoy.length === 0 && (
              <tr>
                <td colSpan={4} className="dashboard-vacio">
                  {cargando
                    ? "Cargando..."
                    : "No hay citas pendientes para hoy."}
                </td>
              </tr>
            )}

            {agendaHoy.map((cita) => (
              <tr key={cita.id_cita}>
                <td>{formatHora(cita.hora)}</td>

                <td>
                  {cita.nombre_usuario} {cita.apellido}
                </td>

                <td>{cita.nombre_servicio}</td>

                <td>
                  <div className="dashboard-acciones">
                    <FaCalendarAlt
                      title="Reprogramar cita"
                      style={{ cursor: "pointer" }}
                      onClick={() => abrirModalReprogramar(cita)}
                    />

                    <FaCheckCircle
                      className="accion-completar"
                      title="Finalizar cita"
                      onClick={() => abrirModalFinalizar(cita)}
                    />

                    <FaTimesCircle
                      className="accion-cancelar"
                      title="Cancelar cita"
                      onClick={() => abrirModalCancelar(cita)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
{mostrarModalFinalizar && (
  <div
    className="modal-overlay"
    onClick={() => setMostrarModalFinalizar(false)}
  >
    <div
      className="modal-box"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="modal-header">
        <h2>Finalizar cita</h2>
      </div>

      <div className="modal-body">
        <label>Diagnóstico</label>
        <textarea
          placeholder="Diagnóstico"
          value={diagnostico}
          onChange={(e) => setDiagnostico(e.target.value)}
        />

        <label>Observaciones</label>
        <textarea
          placeholder="Observaciones"
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
        />
      </div>

      <div className="modal-footer">
        <button
          className="btn-cancel"
          onClick={() => setMostrarModalFinalizar(false)}
        >
          Cancelar
        </button>

        <button
          className="btn-save"
          onClick={completarCita}
        >
          Confirmar
        </button>
      </div>
    </div>
  </div>
)}


{mostrarModalCancelar && (
  <div
    className="modal-overlay"
    onClick={() => setMostrarModalCancelar(false)}
  >
    <div className="modal-box" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h2>Cancelar cita</h2>
      </div>

      <div className="modal-body">
        <label>Motivo</label>
        <textarea
          placeholder="Motivo de la cancelación"
          value={motivoCancelacion}
          onChange={(e) => setMotivoCancelacion(e.target.value)}
        />
      </div>

      <div className="modal-footer">
        <button
          className="btn-cancel"
          onClick={() => setMostrarModalCancelar(false)}
        >
          Cancelar
        </button>

        <button className="btn-save" onClick={confirmarCancelacion}>
          Confirmar
        </button>
      </div>
    </div>
  </div>
)}


{mostrarModalReprogramar && (
  <div
    className="modal-overlay"
    onClick={() => setMostrarModalReprogramar(false)}
  >
    <div className="modal-box" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h2>Reprogramar cita</h2>
      </div>

      <div className="modal-body">
        <label>Nueva fecha</label>
        <input
          type="date"
          min={new Date().toLocaleDateString("en-CA")}
          value={nuevaFecha}
          onChange={(e) => {
            setNuevaFecha(e.target.value);
            setNuevaHora("");
          }}
        />

        <label>Nueva hora</label>
        <select
          value={nuevaHora}
          onChange={(e) => setNuevaHora(e.target.value)}
          disabled={!nuevaFecha || horariosDisponibles.length === 0}
        >
          <option value="">
            {!nuevaFecha
              ? "Primero selecciona una fecha"
              : "Selecciona un horario"}
          </option>

          {horariosDisponibles.map((horario) => (
            <option key={horario} value={horario}>
              {horario}
            </option>
          ))}
        </select>

        <label>Motivo</label>
        <textarea
          placeholder="Motivo de la reprogramación"
          value={motivoReprogramacion}
          onChange={(e) => setMotivoReprogramacion(e.target.value)}
        />
      </div>

      <div className="modal-footer">
        <button
          className="btn-cancel"
          onClick={() => setMostrarModalReprogramar(false)}
        >
          Cancelar
        </button>

        <button className="btn-save" onClick={confirmarReprogramacion}>
          Confirmar
        </button>
      </div>
    </div>
  </div>
)}


    </>
  );
}


function AdminPanel() {
  const [solicitudCrearCita, setSolicitudCrearCita] = useState(0);
  const [solicitudCrearPaciente, setSolicitudCrearPaciente] = useState(0);

  return (
    <div className="admin-container">
      <Sidebar />

      <div className="admin-content">
        <Routes>
          <Route
            index
            element={
              <AdminInicio
                onCrearCita={() =>
                  setSolicitudCrearCita((n) => n + 1)
                }
                onAgregarPaciente={() =>
                  setSolicitudCrearPaciente((n) => n + 1)
                }
              />
            }
          />

          <Route path="usuarios" element={<AdminUsuarios />} />
          <Route path="citas" element={<CitasAdmin />} />
          <Route path="servicios" element={<AdminServicios />} />
          <Route path="historial" element={<AdminHistorial />} />

          <Route
            path="historial/:idPaciente"
            element={<AdminHistorialPaciente />}
          />

          <Route
            path="promociones"
            element={<AdminPromociones />}
          />

          <Route
            path="comentarios"
            element={<AdminComentarios />}
          />

          <Route path="faqs" element={<AdminFaqs />} />
          <Route path="galeria" element={<AdminImagenes />} />
          <Route path="reportes" element={<AdminReportes />} />
        </Routes>

        <CitasAdmin
          modoModal={true}
          solicitudAbrirModal={solicitudCrearCita}
        />

        <AdminUsuarios
          modoModal={true}
          solicitudAbrirModal={solicitudCrearPaciente}
        />
      </div>
    </div>
  );
}
export default AdminPanel;