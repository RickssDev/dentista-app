import {
  FaHome,
  FaUsers,
  FaCalendarAlt,
  FaStethoscope,
  FaHistory,
  FaTags,
  FaQuestionCircle,
  FaImages,
  FaComments,
  FaChartBar,
  FaBars
} from "react-icons/fa";

import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/sidebar.css";

function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { name: "Inicio", path: "/admin", icon: <FaHome /> },
    { name: "Usuarios", path: "/admin/usuarios", icon: <FaUsers /> },
    { name: "Citas", path: "/admin/citas", icon: <FaCalendarAlt /> },
    { name: "Servicios", path: "/admin/servicios", icon: <FaStethoscope /> },
    { name: "Historial", path: "/admin/historial", icon: <FaHistory /> },
    { name: "Promociones", path: "/admin/promociones", icon: <FaTags /> },
    { name: "Faqs", path: "/admin/faqs", icon: <FaQuestionCircle /> },
    { name: "Galería", path: "/admin/galeria", icon: <FaImages /> },
    { name: "Comentarios", path: "/admin/comentarios", icon: <FaComments /> },
    { name: "Reportes", path: "/admin/reportes", icon: <FaChartBar /> }
  ];

  return (
    <>
      {/* BOTÓN ABRIR */}
      <button className="open-btn" onClick={() => setIsOpen(true)}>
        ☰
      </button>

      <div className={`sidebar ${isOpen ? "open" : ""}`}>
        
        {/* HEADER */}
        <div className="sidebar-header">
          <span>Menú</span>
          <FaBars className="menu-icon" onClick={() => setIsOpen(!isOpen)} />
        </div>

        {/* MENÚ */}
        <ul className="menu">
          {menuItems.map((item) => (
            <li
              key={item.name}
              className={location.pathname === item.path ? "active" : ""}
              onClick={() => {
                navigate(item.path);
                setIsOpen(false);
              }}
            >
              <span>{item.name}</span>
              <span className="icon">{item.icon}</span>
            </li>
          ))}
        </ul>

        {/* 🔥 CERRAR SESIÓN */}
        <div className="logout-container">
          <button
            className="logout-btn"
            onClick={() => {
              // aquí puedes limpiar sesión después
              navigate("/");
            }}
          >
            Cerrar sesión
          </button>
        </div>

      </div>
    </>
  );
}

export default Sidebar;