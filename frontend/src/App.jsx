import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/admin/login";
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

        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<Login />} />

        <Route path="/home" element={<Home />} />

        {/* ADMIN PROTEGIDO */}
        <Route
          path="/admin/*"
          element={
            <PrivateRoute>
              <AdminPanel />
            </PrivateRoute>
          }
        />

        {/* PACIENTE */}
        <Route
          path="/paciente"
          element={
            <PrivateRoute>
              <InicioPaciente />
            </PrivateRoute>
          }
        />

        <Route
          path="/paciente/citaspaciente"
          element={
            <PrivateRoute>
              <CitasPaciente />
            </PrivateRoute>
          }
        />

        <Route
          path="/paciente/perfil"
          element={
            <PrivateRoute>
              <PerfilPaciente />
            </PrivateRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;