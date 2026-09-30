import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/AdminPanel.css";
import { FaSearch, FaPlus } from "react-icons/fa";
import { api } from "../../services/api";

function AdminHistorial() {
  const [historial, setHistorial] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const obtenerHistorial = async () => {
    try {
      setCargando(true);
      setError("");

      const data = await api("/historial");
      setHistorial(data.payload || []);
    } catch (error) {
      console.error(error);
      setError("No se pudo cargar el historial clínico.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    obtenerHistorial();
  }, []);

  const formatearFecha = (fecha) => {
    if (!fecha) return "Sin fecha";

    const f = new Date(fecha);

    if (Number.isNaN(f.getTime())) {
      return "Fecha no válida";
    }

    return f.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC",
    });
  };

  const historialFiltrado = historial.filter((item) =>
    (item.nombre_usuario || "")
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  );

  const verHistorial = (idPaciente) => {
    navigate(`/admin/historial/${idPaciente}`);
  };

  return (
    <div className="servicios-container historial-page">
      <div className="topbar">
        <h2>Historial Clínico</h2>

        <div className="historial-actions">
          <div className="search-bar">
            <FaSearch />
            <input
              type="text"
              placeholder="Buscar paciente..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          {/* Pendiente: implementar creación de registros */}
          <button
            type="button"
            className="btn-add"
            disabled
            title="Funcionalidad pendiente"
          >
            <FaPlus /> Nuevo registro
          </button>
        </div>
      </div>

      {error && <p className="historial-error">{error}</p>}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Nombre del paciente</th>
              <th>Última consulta</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {cargando ? (
              <tr>
                <td colSpan="3" className="historial-empty">
                  Cargando historiales...
                </td>
              </tr>
            ) : historialFiltrado.length === 0 ? (
              <tr>
                <td colSpan="3" className="historial-empty">
                  {busqueda
                    ? "No se encontraron pacientes."
                    : "Todavía no hay historiales clínicos."}
                </td>
              </tr>
            ) : (
              historialFiltrado.map((item) => (
                <tr key={item.id_paciente}>
                  <td>{item.nombre_usuario}</td>

                  <td>{formatearFecha(item.ultima_consulta)}</td>

                  <td>
                    <button
                      type="button"
                      className="btn-link"
                      onClick={() => verHistorial(item.id_paciente)}
                    >
                      Ver historial
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminHistorial;