import Sidebar from "../../components/sidebar";
import "../../styles/AdminPanel.css";

import { Routes, Route } from "react-router-dom";

import AdminUsuarios from "./AdminUsuarios";
import AdminServicios from "./AdminServicios";
import AdminHistorial from "./AdminHistorial";
import AdminPromociones from "./AdminPromociones";
import CitasAdmin from "./CitasAdmin";
import AdminHistorialPaciente from "./AdminHPaciente";
import AdminComentarios from "./AdminComentarios";

import {
  FaPlus,
  FaBook,
  FaUserPlus,
  FaComments,
  FaFire,
  FaTrash
} from "react-icons/fa";

function AdminPanel() {
  const usuario = JSON.parse(localStorage.getItem("user"));
  const citas = [
    { hora: "08:00 AM", paciente: "Eva García", servicio: "Limpieza" },
    { hora: "09:00 AM", paciente: "Xavier Solís", servicio: "Resinas" }
  ];

  return (
    <div className="admin-container">

      <Sidebar />

      <div className="admin-content">

        <Routes>

          {/* ===================== PANEL PRINCIPAL ===================== */}
          <Route
            index
            element={
              <>
                <div className="topbar">
                  <h2>Administrador</h2>

                  <div className="user">
                    <div className="avatar"></div>
                    <span>{usuario?.nombre_usuario}</span>
                  </div>
                </div>

                <h1 className="panel-title">Panel de control</h1>

                <div className="stats">
                  <div className="stat-card">
                    <p>Citas del día</p>
                    <h2>4</h2>
                  </div>

                  <div className="stat-card">
                    <p>Citas próximas</p>
                    <h2>2</h2>
                  </div>

                  <div className="stat-card">
                    <p>Pacientes nuevos</p>
                    <h2>4</h2>
                  </div>
                </div>

                <div className="actions">
                  <div className="action-card">
                    <FaPlus />
                    <p>Crear cita</p>
                  </div>

                  <div className="action-card">
                    <FaBook />
                    <p>Ver agenda</p>
                  </div>

                  <div className="action-card">
                    <FaUserPlus />
                    <p>Agregar paciente</p>
                  </div>

                  <div className="action-card">
                    <FaComments />
                    <p>Revisar comentarios</p>
                  </div>

                  <div className="action-card">
                    <FaFire />
                    <p>Crear promoción</p>
                  </div>
                </div>

                <div className="table-container">
                  <h2>Próximas citas de hoy</h2>

                  <table>
                    <thead>
                      <tr>
                        <th>Hora</th>
                        <th>Paciente</th>
                        <th>Servicio</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>

                    <tbody>
                      {citas.map((cita, index) => (
                        <tr key={index}>
                          <td>{cita.hora}</td>
                          <td>{cita.paciente}</td>
                          <td>{cita.servicio}</td>
                          <td>
                            <FaTrash className="delete-icon" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            }
          />

          {/* ===================== RUTAS ===================== */}

          <Route path="usuarios" element={<AdminUsuarios />} />

       
          <Route path="citas" element={<CitasAdmin />} />

          <Route path="servicios" element={<AdminServicios />} />

          <Route path="historial" element={<AdminHistorial />} />

          <Route path="promociones" element={<AdminPromociones />} />

          <Route path="historial/:idPaciente" element={<AdminHistorialPaciente />} />

          <Route path="comentarios" element={<AdminComentarios />} />

        </Routes>

      </div>
    </div>
  );
}

export default AdminPanel;