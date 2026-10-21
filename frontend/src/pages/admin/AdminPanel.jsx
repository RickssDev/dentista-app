import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import "../../styles/AdminPanel.css";

import Sidebar from "../../components/sidebar";

import AdminInicio from "./AdminInicio";
import AdminUsuarios from "./AdminUsuarios";
import AdminServicios from "./AdminServicios";
import AdminHistorial from "./AdminHistorial";
import AdminPromociones from "./AdminPromociones";
import CitasAdmin from "./CitasAdmin";
import AdminHistorialPaciente from "./AdminHPaciente";
import AdminComentarios from "./AdminComentarios";
import AdminFaqs from "./Adminfaqs";
import AdminImagenes from "./Admingaleria";
import AdminReportes from "./Adminreportes";

function AdminPanel() {
  const [solicitudCrearCita, setSolicitudCrearCita] = useState(0);
  const [solicitudCrearPaciente, setSolicitudCrearPaciente] = useState(0);
  const [recargarInicio, setRecargarInicio] = useState(0);

  const refrescarInicio = () => setRecargarInicio((n) => n + 1);

  return (
    <div className="admin-container">
      <Sidebar />

      <div className="admin-content">
        <Routes>
          <Route
            index
            element={
              <AdminInicio
                recargar={recargarInicio}
                onCrearCita={() => setSolicitudCrearCita((n) => n + 1)}
                onAgregarPaciente={() => setSolicitudCrearPaciente((n) => n + 1)}
              />
            }
          />

          <Route path="usuarios" element={<AdminUsuarios />} />
          <Route path="citas" element={<CitasAdmin />} />
          <Route path="servicios" element={<AdminServicios />} />
          <Route path="historial" element={<AdminHistorial />} />
          <Route path="historial/:idPaciente" element={<AdminHistorialPaciente />} />
          <Route path="promociones" element={<AdminPromociones />} />
          <Route path="comentarios" element={<AdminComentarios />} />
          <Route path="faqs" element={<AdminFaqs />} />
          <Route path="galeria" element={<AdminImagenes />} />
          <Route path="reportes" element={<AdminReportes />} />
        </Routes>

        <CitasAdmin
          modoModal={true}
          solicitudAbrirModal={solicitudCrearCita}
          onCerrarModalDashboard={refrescarInicio}
        />

        <AdminUsuarios
          modoModal={true}
          solicitudAbrirModal={solicitudCrearPaciente}
          onCerrarModalDashboard={refrescarInicio}
        />
      </div>
    </div>
  );
}

export default AdminPanel;