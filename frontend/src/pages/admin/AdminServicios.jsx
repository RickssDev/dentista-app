import "../../styles/AdminPanel.css";
import { FaEdit, FaTrash, FaSearch, FaPlus } from "react-icons/fa";

function AdminServicios() {

  const servicios = [
    {
      id: 1,
      nombre: "Limpieza Dental Profesional",
      descripcion: "Eliminacion de placa y sarro",
      duracion: "45 Min",
      estado: "Activo",
      img: "https://via.placeholder.com/60"
    },
    {
      id: 2,
      nombre: "Blanqueamiento Dental",
      descripcion: "Aclaramiento del esmalte dental",
      duracion: "90 Min",
      estado: "Activo",
      img: "https://via.placeholder.com/60"
    },
    {
      id: 3,
      nombre: "Extraccion de Muela del Juicio",
      descripcion: "Cirugia para remover terceros molares",
      duracion: "60 Min",
      estado: "Inactivo",
      img: "https://via.placeholder.com/60"
    }
  ];

  return (
    <div className="servicios-container">

      {/* HEADER */}
      <div className="servicios-header">
        <h1>Servicios</h1>

        <button className="btn-add">
          <FaPlus /> Nuevo servicio
        </button>
      </div>

      {/* BUSCADOR */}
      <div className="search-bar">
        <FaSearch />
        <input type="text" placeholder="Buscar por nombre de servicio" />
      </div>

      {/* FILTRO */}
      <div className="filter">
        <button className="btn-filter">
          Mostrar por ▾
        </button>
      </div>

      {/* TABLA */}
      <div className="servicios-table">

        <div className="table-header servicios-grid">
          <span>Foto del servicio</span>
          <span>Nombre del servicio</span>
          <span>Descripción</span>
          <span>Duración</span>
          <span>Estado</span>
          <span>Acciones</span>
        </div>

        {servicios.map((servicio) => (
          <div key={servicio.id} className="table-row servicios-grid">

            <img src={servicio.img} className="servicio-img" />

            <span>{servicio.nombre}</span>
            <span>{servicio.descripcion}</span>
            <span>{servicio.duracion}</span>

            <span className={`estado ${servicio.estado === "Activo" ? "activo" : "inactivo"}`}>
              {servicio.estado}
            </span>

            <div className="acciones">
              <FaEdit className="edit" />
              <FaTrash className="delete" />
            </div>

          </div>
        ))}

      </div>

    </div>
  );
}

export default AdminServicios;