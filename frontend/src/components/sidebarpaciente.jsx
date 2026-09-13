import {
  FaHome,
  FaCalendarAlt,
  FaUser,
  FaBars
} from "react-icons/fa";

import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/sidebarPaciente.css";


function SidebarPaciente() {

  const [isOpen, setIsOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();


  const menuItems = [
    {
      name: "Inicio",
      path: "/paciente",
      icon: <FaHome />
    },
    {
      name: "Mis citas",
      path: "/paciente/citaspaciente",
      icon: <FaCalendarAlt />
    },
    {
      name: "Mi perfil",
      path: "/paciente/perfil",
      icon: <FaUser />
    }
  ];


  const cerrarSesion = () => {

    const confirmar = window.confirm("¿Cerrar sesión?");

    if (!confirmar) return;


    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("rol");
    localStorage.removeItem("tienePerfilPaciente");

    sessionStorage.clear();


    navigate("/login", { replace: true });

  };


  return (
    <>


      <button
        className="open-btn-paciente"
        onClick={() => setIsOpen(true)}
      >
        ☰
      </button>



      <div className={`sidebar-paciente ${isOpen ? "open" : ""}`}>


        <div className="sidebar-header-paciente">

          <span>
            Menú Paciente
          </span>


          <FaBars
            className="menu-icon-paciente"
            onClick={() => setIsOpen(!isOpen)}
          />

        </div>



        <ul className="menu-paciente">


          {menuItems.map((item) => (

            <li
              key={item.name}

              className={
                location.pathname === item.path
                ? "active-paciente"
                : ""
              }


              onClick={() => {

                navigate(item.path);
                setIsOpen(false);

              }}

            >

              <span>
                {item.name}
              </span>


              <span className="icon-paciente">
                {item.icon}
              </span>


            </li>

          ))}


        </ul>



        <div className="logout-container-paciente">


          <button
            className="logout-btn-paciente"
            onClick={cerrarSesion}
          >

            Cerrar sesión

          </button>


        </div>



      </div>


    </>
  );
}


export default SidebarPaciente;