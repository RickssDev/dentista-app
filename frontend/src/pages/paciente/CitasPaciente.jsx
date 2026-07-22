import { useEffect, useState } from "react";
import SidebarPaciente from "../../components/SidebarPaciente";
import { api } from "../../services/api";
import "../../styles/MisCitas.css"; // O puedes reusar InicioPaciente.css si prefieres

function CitasPaciente() {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para el modal de agendar
  const [mostrarAgendar, setMostrarAgendar] = useState(false);
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [idServicio, setIdServicio] = useState("");

  // Asumiendo que obtienes el id del paciente autenticado de algún lado (contexto, localStorage o la misma API)
  // Lo pondré estático a 4 como en tu ejemplo del JSON, pero ajústalo a tu lógica.
  const idPaciente = 4;

  useEffect(() => {
    cargarCitas();
  }, []);

  const cargarCitas = async () => {
    try {
      setLoading(true);
      // Usamos tu servicio api exactamente como en InicioPaciente
      const res = await api(`/citas/paciente/${idPaciente}`);
      
      // Manejo por si la API devuelve directamente el array o dentro de un objeto
      const data = res.data ? res.data : res;
      setCitas(Array.isArray(data) ? data : [data]);
    } catch (error) {
      console.error(error);
      setCitas([]);
    } finally {
      setLoading(false);
    }
  };

  const agendarCita = async () => {
    try {
      await api(
        "/citas/paciente",
        "POST",
        {
          id_paciente: idPaciente,
          fecha_agendada: fecha,
          hora: hora,
          id_servicio: parseInt(idServicio)
        }
      );

      alert("Cita agendada correctamente");
      setMostrarAgendar(false);
      
      // Limpiar formulario
      setFecha("");
      setHora("");
      setIdServicio("");
      
      // Recargar la tabla
      cargarCitas();
    } catch (error) {
      alert(error.message || "Error al agendar la cita");
    }
  };

  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return "";
    return new Date(fechaISO).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatearHora = (horaString) => {
    if (!horaString) return "";
    const [h, m] = horaString.split(':');
    const horas = parseInt(h, 10);
    const ampm = horas >= 12 ? 'PM' : 'AM';
    const hora12 = horas % 12 || 12;
    return `${hora12 < 10 ? '0' + hora12 : hora12}:${m} ${ampm}`;
  };

  const getClassEstado = (estado) => {
    const estadoNormalizado = estado?.toLowerCase();
    if (estadoNormalizado === 'confirmada' || estadoNormalizado === 'completada') {
      return 'estado confirmada';
    } else if (estadoNormalizado === 'pendiente') {
      return 'estado pendiente';
    }
    return 'estado cancelada';
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
                    <td>{formatearFecha(cita.fecha_agendada)}</td>
                    <td>{formatearHora(cita.hora)}</td>
                    <td>{cita.nombre_servicio}</td>
                    <td>Por asignar</td>
                    <td>
                      <span className={getClassEstado(cita.estado)}>
{cita.estado ? (cita.estado.charAt(0).toUpperCase() + cita.estado.slice(1)) : 'Sin estado'}
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
              onChange={(e) => setFecha(e.target.value)}
            />

            <label>Hora</label>
            <input
              type="time"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
            />

            <label>Servicio</label>
            <select 
              value={idServicio} 
              onChange={(e) => setIdServicio(e.target.value)}
            >
              <option value="">Selecciona un servicio</option>
              <option value="1">Limpieza Dental</option>
              <option value="2">Odontología General</option>
              {/* Aquí podrías mapear los servicios desde otra petición GET /servicios si lo necesitas */}
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

              <button
                className="btn btn-reprogramar"
                onClick={agendarCita}
              >
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