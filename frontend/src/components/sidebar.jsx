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
  FaBars,
  FaTimes,
  FaSignOutAlt,
} from "react-icons/fa";

import { useEffect, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import "../styles/sidebar.css";
import ModalConfirmacion from "./ModalConfirmacion";

// Imágenes de marca (guárdalas en src/assets/; ajusta la ruta si tu carpeta es otra)
import logoBlanco from "../assets/logo-melissa-blanco.png";
import logoDiente from "../assets/logo-melissa-diente.png";

const MENU_ITEMS = [
  { name: "Inicio", path: "/admin", icon: <FaHome /> },
  { name: "Usuarios", path: "/admin/usuarios", icon: <FaUsers /> },
  { name: "Citas", path: "/admin/citas", icon: <FaCalendarAlt /> },
  { name: "Servicios", path: "/admin/servicios", icon: <FaStethoscope /> },
  { name: "Historial", path: "/admin/historial", icon: <FaHistory /> },
  { name: "Promociones", path: "/admin/promociones", icon: <FaTags /> },
  { name: "Faqs", path: "/admin/faqs", icon: <FaQuestionCircle /> },
  { name: "Galería", path: "/admin/galeria", icon: <FaImages /> },
  { name: "Comentarios", path: "/admin/comentarios", icon: <FaComments /> },
  { name: "Reportes", path: "/admin/reportes", icon: <FaChartBar /> },
];

// Opciones visibles para el rol asistente
const MENU_ASISTENTE = ["Inicio", "Citas", "Servicios", "Promociones", "Galería"];

function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmarSalida, setConfirmarSalida] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const rol = localStorage.getItem("rol")?.trim().toLowerCase();
  const menuFiltrado =
    rol === "asistente"
      ? MENU_ITEMS.filter((item) => MENU_ASISTENTE.includes(item.name))
      : MENU_ITEMS;

  // Cierra el menú al cambiar de página (incluye el botón "atrás")
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Con el menú abierto (móvil): bloquea el scroll del fondo y cierra con Escape
  useEffect(() => {
    if (!isOpen) return;

    document.body.classList.add("sidebar-abierto");

    const alPresionar = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", alPresionar);

    return () => {
      document.body.classList.remove("sidebar-abierto");
      document.removeEventListener("keydown", alPresionar);
    };
  }, [isOpen]);

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("rol");
    sessionStorage.clear();

    navigate("/login", { replace: true });
  };

  return (
    <>
      {/* Barra superior (solo móvil) */}
      <div className="sidebar-movil-barra">
        <button
          type="button"
          className="sidebar-abrir"
          onClick={() => setIsOpen(true)}
          aria-label="Abrir menú"
          aria-expanded={isOpen}
        >
          <FaBars />
        </button>
        <img className="sidebar-movil-logo" src={logoDiente} alt="" />
        <span>Panel de administración</span>
      </div>

      {/* Fondo oscuro (solo móvil, con el menú abierto) */}
      {isOpen && (
        <div className="sidebar-fondo" onClick={() => setIsOpen(false)} />
      )}

      <aside className={`sidebar${isOpen ? " open" : ""}`}>
        <div className="sidebar-header">
          <img
            className="sidebar-logo"
            src={logoBlanco}
            alt="Melissa López N. Odontología Integral"
          />
          <button
            type="button"
            className="sidebar-cerrar"
            onClick={() => setIsOpen(false)}
            aria-label="Cerrar menú"
          >
            <FaTimes />
          </button>
        </div>

        <nav aria-label="Menú principal">
          <ul className="menu">
            {menuFiltrado.map((item) => (
              <li key={item.name}>
                <NavLink to={item.path} end={item.path === "/admin"}>
                  <span className="sidebar-icono" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className="sidebar-texto">{item.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-pie">
          <button
            type="button"
            className="sidebar-salir"
            onClick={() => setConfirmarSalida(true)}
          >
            <FaSignOutAlt />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Fuera del <aside>: el sidebar tiene transform y rompería el position: fixed */}
      <ModalConfirmacion
        abierto={confirmarSalida}
        titulo="Cerrar sesión"
        mensaje="¿Seguro que quieres cerrar sesión?"
        textoConfirmar="Cerrar sesión"
        peligro
        onConfirmar={cerrarSesion}
        onCancelar={() => setConfirmarSalida(false)}
      />
    </>
  );
}

export default Sidebar;