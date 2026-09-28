import { useEffect, useState } from "react";
import SidebarPaciente from "../../components/SidebarPaciente";
import { api } from "../../services/api";
import "../../styles/MisCitas.css"; // O puedes reusar InicioPaciente.css si prefieres

function CitasPaciente() {
const obtenerFechaHoy = () => {
  const hoy = new Date();

  const year = hoy.getFullYear();
  const month = String(hoy.getMonth() + 1).padStart(2, "0");
  const day = String(hoy.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

  const fechaMinima = obtenerFechaHoy();

  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para el modal de agendar
  const [mostrarAgendar, setMostrarAgendar] = useState(false);
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [idServicio, setIdServicio] = useState("");
  const [horarios, setHorarios] = useState([]);
  const [servicios, setServicios] = useState([]);

  useEffect(() => {
    cargarCitas();
    cargarServicios();
  }, []);

  useEffect(() => {
  cargarHorarios();
}, [fecha, idServicio]);

  const cargarCitas = async () => {
    try {
      setLoading(true);

      const res = await api("/citas/miscitas");
      const data = res?.payload ?? res?.data ?? res;

      setCitas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("ERROR:", error);
      setCitas([]);
    } finally {
      setLoading(false);
    }
  };

  const cargarServicios = async () => {
    try {
      const res = await api("/servicios/publicos");

      const data = res?.payload ?? res?.data ?? res;

      setServicios(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al cargar servicios:", error);
      setServicios([]);
    }
  };

  const cargarHorarios = async () => {
  if (!fecha || !idServicio) {
    setHorarios([]);
    setHora("");
    return;
  }

  try {
    const res = await api(
      `/citas/horarios-disponibles?fecha=${fecha}&id_servicio=${idServicio}`
    );

    const data = res?.payload ?? res?.data ?? res;

    setHorarios(Array.isArray(data) ? data : []);
    setHora("");
  } catch (error) {
    console.error("Error al cargar horarios:", error);
    setHorarios([]);
    setHora("");

    alert(error.message || "No se pudieron cargar los horarios");
  }
};

  const agendarCita = async () => {
    const datos = {
      fecha_agendada: fecha,
      hora: hora,
      id_servicio: parseInt(idServicio),
    };

    try {
      await api("/citas/paciente", "POST", datos);

      alert("Cita agendada correctamente");

      setMostrarAgendar(false);
      setFecha("");
      setHora("");
      setIdServicio("");

      cargarCitas();
    } catch (error) {
      console.error(error);
      alert(error.message || "Error al agendar la cita");
    }
  };
  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return "";

    const fecha = fechaISO.substring(0, 10);

    const [year, month, day] = fecha.split("-");

    return `${day}/${month}/${year}`;
  };

  const formatearHora = (horaString) => {
    if (!horaString) return "";
    const [h, m] = horaString.split(":");
    const horas = parseInt(h, 10);
    const ampm = horas >= 12 ? "PM" : "AM";
    const hora12 = horas % 12 || 12;
    return `${hora12 < 10 ? "0" + hora12 : hora12}:${m} ${ampm}`;
  };

  const getClassEstado = (estado) => {
    const estadoNormalizado = estado?.toLowerCase();
    if (
      estadoNormalizado === "confirmada" ||
      estadoNormalizado === "completada"
    ) {
      return "estado confirmada";
    } else if (estadoNormalizado === "pendiente") {
      return "estado pendiente";
    }
    return "estado cancelada";
  };
  return (
    <>
      <SidebarPaciente />

      <div className="inicio-container">
        <div className="header-citas">
          <h1>Mis Citas</h1>
          <button
            className="btn btn-reprogramar"
            onClick={() => setMostrarAgendar(true)}
          >
            + Agendar Nueva Cita
          </button>
        </div>

        <div className="card">
          {loading ? (
            <p>Cargando tus citas...</p>
          ) : citas.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>FECHA</th>
                  <th>HORA</th>
                  <th>TRATAMIENTO</th>
                  <th>ESPECIALISTA</th>
                  <th>ESTADO</th>
                </tr>
              </thead>
              <tbody>
                {citas.map((cita, index) => (
                  <tr key={cita.id || index}>
                    <td>{cita.id}</td>
                    <td>{formatearFecha(cita.fecha_agendada)}</td>
                    <td>{formatearHora(cita.hora)}</td>
                    <td>{cita.nombre_servicio}</td>
                    <td>Por asignar</td>
                    <td>
                      <span className={getClassEstado(cita.estado)}>
                        {cita.estado
                          ? cita.estado.charAt(0).toUpperCase() +
                            cita.estado.slice(1)
                          : "Sin estado"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No tienes citas en tu historial.</p>
          )}

          {/* Paginación visual (Maqueta) */}
          {!loading && citas.length > 0 && (
            <div className="paginacion">
              <button className="btn-pag">&lt;</button>
              <button className="btn-pag activa">1</button>
              <button className="btn-pag">2</button>
              <button className="btn-pag">3</button>
              <button className="btn-pag">&gt;</button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL AGENDAR CITA */}
      {mostrarAgendar && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Agendar Nueva Cita</h2>

            <label>Fecha</label>

            <input
              type="date"
              value={fecha}
              min={fechaMinima}
              onChange={(e) => setFecha(e.target.value)}
            />

            <label>Hora</label>

            <select
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              disabled={!fecha || !idServicio}
            >
              <option value="">
                {!fecha
                  ? "Primero selecciona una fecha"
                  : !idServicio
                    ? "Primero selecciona un servicio"
                    : "Selecciona un horario"}
              </option>

              {horarios.map((horario) => (
                <option key={horario} value={horario}>
                  {formatearHora(horario)}
                </option>
              ))}
            </select>

            <label>Servicio</label>
            <select
              value={idServicio}
              onChange={(e) => setIdServicio(e.target.value)}
            >
              <option value="">Selecciona un servicio</option>

              {servicios.map((servicio) => (
                <option key={servicio.id} value={servicio.id}>
                  {servicio.nombre}
                </option>
              ))}
            </select>

            <div className="modal-botones">
              <button
                className="btn btn-cancelar"
                onClick={() => {
                  setMostrarAgendar(false);
                  setFecha("");
                  setHora("");
                  setIdServicio("");
                }}
              >
                Cerrar
              </button>

              <button className="btn btn-reprogramar" onClick={agendarCita}>
                Agendar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CitasPaciente;
