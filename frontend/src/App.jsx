import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/admin/Login";
import AdminPanel from "./pages/admin/AdminPanel";
import InicioPaciente from "./pages/paciente/InicioPaciente";
import CitasPaciente from "./pages/paciente/CitasPaciente";
import PerfilPaciente from "./pages/paciente/PerfilPaciente";

function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Página principal */}
        <Route path="/" element={<Home />} />

        {/* Login */}
        <Route path="/login" element={<Login />} />

        {/* Panel de administrador */}
        <Route
          path="/admin/*"
          element={
            <PrivateRoute>
              <AdminPanel />
            </PrivateRoute>
          }
        />

        {/* Inicio del paciente */}
        <Route
          path="/paciente"
          element={
            <PrivateRoute>
              <InicioPaciente />
            </PrivateRoute>
          }
        />

        {/* Citas del paciente */}
        <Route
          path="/paciente/citaspaciente"
          element={
            <PrivateRoute>
              <CitasPaciente />
            </PrivateRoute>
          }
        />

        {/* Perfil del paciente */}
        <Route
          path="/paciente/perfil"
          element={
            <PrivateRoute>
              <PerfilPaciente />
            </PrivateRoute>
          }
        />

        {/* Cualquier ruta inexistente */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;