import "../../styles/AdminPanel.css";
import { FaSearch, FaPlus } from "react-icons/fa";

function AdminHistorial() {

  const historial = [
    {
      nombre: "Juan Pablo Solís Lino",
      fecha: "15/05/2025",
      estado: "Activo"
    },
    {
      nombre: "Kevin Esahú Palacios",
      fecha: "11/02/2025",
      estado: "Seguimiento"
    },
    {
      nombre: "Indira Jeanine Berdeja",
      fecha: "07/09/2025",
      estado: "Alta"
    }
  ];

  return (
    <div className="servicios-container">

      {/* TOPBAR */}
      <div className="topbar">
        <h2>Historial Clínico</h2>

        <div style={{ display: "flex", gap: "15px" }}>
          <div className="search-bar">
            <FaSearch />
            <input type="text" placeholder="Buscar paciente..." />
          </div>

          <button className="btn-add">
            <FaPlus /> Nuevo registro
          </button>
        </div>
      </div>

      {/* TABLA */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Nombre del paciente</th>
              <th>Última consulta</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {historial.map((item, index) => (
              <tr key={index}>
                <td>{item.nombre}</td>
                <td>{item.fecha}</td>

                <td>
                  <span className={`estado ${
                    item.estado === "Activo"
                      ? "activo"
                      : item.estado === "Seguimiento"
                      ? "activo"
                      : "inactivo"
                  }`}>
                    {item.estado}
                  </span>
                </td>

                <td style={{ cursor: "pointer" }}>
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