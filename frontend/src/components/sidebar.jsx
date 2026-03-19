import { useState } from "react";
import "../styles/sidebar.css"

function Sidebar() {
  const [active, setActive] = useState("Promociones");

  const menuItems = [
    "Inicio",
    "Usuarios",
    "Citas",
    "Servicios",
    "Historial",
    "Promociones",
    "Faqs",
    "Galería",
    "Comentarios",
    "Reportes"
  ];

  return (
    <div className="sidebar">
      
      {/* HEADER */}
      <div className="sidebar-header">
        <span>Menú</span>
        <span className="menu-icon">☰</span>
      </div>

      {/* MENU */}
      <ul className="menu">
        {menuItems.map((item) => (
          <li
            key={item}
            className={active === item ? "active" : ""}
            onClick={() => setActive(item)}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Sidebar;