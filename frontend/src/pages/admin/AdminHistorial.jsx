import { useEffect, useState } from "react";
import "../../styles/AdminPanel.css";
import { FaSearch, FaPlus } from "react-icons/fa";
import { api } from "../../services/api";
function AdminHistorial() {
  const [historial, setHistorial] = useState([]);
  const [busqueda, setBusqueda] = useState("");

  const obtenerHistorial = async () => {
    try {
      const data = await api("/historial");
      setHistorial(data.payload);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    obtenerHistorial();
  }, []);

  const formatearFecha = (fecha) => {
    const f = new Date(fecha);
    return f.toLocaleDateString();
  };

  const historialFiltrado = historial.filter((item) =>
    item.nombre_usuario
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  );

  const verHistorial = (id) => {
    console.log(id);
  };

  return (
    <div className="servicios-container">
      <div className="topbar">
        <h2>Historial Clínico</h2>

        <div style={{ display: "flex", gap: "15px" }}>
          <div className="search-bar">
            <FaSearch />
            <input
              type="text"
              placeholder="Buscar paciente..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <button className="btn-add">
            <FaPlus /> Nuevo registro
          </button>
        </div>
      </div>

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
            {historialFiltrado.map((item) => (
              <tr key={item.id_paciente}>
                <td>{item.nombre_usuario}</td>
                <td>{formatearFecha(item.ultima_consulta)}</td>

                <td
                  style={{ cursor: "pointer" }}
                  onClick={() => verHistorial(item.id_paciente)}
                >
                  Ver historial
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminHistorial;