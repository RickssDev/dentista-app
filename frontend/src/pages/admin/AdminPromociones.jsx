import "../../styles/AdminPanel.css";
import { FaSearch, FaPlus, FaEdit, FaTrash } from "react-icons/fa";

function AdminPromociones() {

  const promociones = [
    {
      img: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5",
      titulo: "Blanqueamiento Dental 2x1",
      fecha: "01/08/2024 - 31/08/2024"
    },
    {
      img: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db",
      titulo: "Limpieza Profunda con 20% de descuento",
      fecha: "01/09/2024 - 31/09/2024"
    },
    {
      img: "https://images.unsplash.com/photo-1581594693702-fbdc51b2763b",
      titulo: "Consulta Infantil Gratuita",
      fecha: "01/10/2024 - 31/10/2024"
    }
  ];

  return (
    <div className="servicios-container">

      {/* HEADER */}
      <div className="topbar">
        <h2>Promociones</h2>

        <button className="btn-add">
          <FaPlus /> Nueva Promoción
        </button>
      </div>

      {/* BUSCADOR */}
      <div className="search-bar">
        <FaSearch />
        <input type="text" placeholder="Buscar por título" />
      </div>

      {/* TABLA */}
      <div className="servicios-table">

        <div className="servicios-grid table-header">
          <span>Foto de la promoción</span>
          <span>Título</span>
          <span>Vigencia</span>
          <span>Acciones</span>
        </div>

        {promociones.map((promo, index) => (
          <div key={index} className="servicios-grid table-row">

            <img src={promo.img} alt="promo" className="servicio-img" />

            <span>{promo.titulo}</span>

            <span>{promo.fecha}</span>

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

export default AdminPromociones;