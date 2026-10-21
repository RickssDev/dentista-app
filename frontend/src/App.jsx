import { lazy, Suspense } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Layout from "./components/home/Layout";
import Home from "./pages/Home";
import Login from "./pages/admin/login";

import AdminPanel from "./pages/admin/AdminPanel";
import InicioPaciente from "./pages/paciente/InicioPaciente";
import CitasPaciente from "./pages/paciente/CitasPaciente";
import PerfilPaciente from "./pages/paciente/PerfilPaciente";
import CompletarPerfil from "./pages/paciente/CompletarPerfil";

import "./styles/home/global.css";

// Páginas públicas cargadas bajo demanda
const About = lazy(() => import("./pages/About"));
const Gallery = lazy(() => import("./pages/Gallery"));
const Contact = lazy(() => import("./pages/Contact"));
const Legal = lazy(() => import("./pages/Legal"));

const NotFound = lazy(() =>
  import("./pages/Legal").then((module) => ({
    default: module.NotFound,
  }))
);

// Protección de rutas privadas
function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");

  return token ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Páginas públicas con el diseño del nuevo proyecto */}
        <Route element={<Layout />}>
          <Route index element={<Home />} />

          <Route
            path="nosotros"
            element={
              <Suspense fallback={<p>Cargando página...</p>}>
                <About />
              </Suspense>
            }
          />

          <Route
            path="galeria"
            element={
              <Suspense fallback={<p>Cargando página...</p>}>
                <Gallery />
              </Suspense>
            }
          />

          <Route
            path="contacto"
            element={
              <Suspense fallback={<p>Cargando página...</p>}>
                <Contact />
              </Suspense>
            }
          />

          <Route
            path="aviso-de-privacidad"
            element={
              <Suspense fallback={<p>Cargando página...</p>}>
                <Legal type="privacidad" />
              </Suspense>
            }
          />

          <Route
            path="terminos-de-servicio"
            element={
              <Suspense fallback={<p>Cargando página...</p>}>
                <Legal type="terminos" />
              </Suspense>
            }
          />

          <Route
            path="*"
            element={
              <Suspense fallback={<p>Cargando página...</p>}>
                <NotFound />
              </Suspense>
            }
          />
        </Route>

        {/* Login: fuera del layout público */}
        <Route path="/login" element={<Login />} />

        {/* Rutas privadas del administrador */}
        <Route
          path="/admin/*"
          element={
            <PrivateRoute>
              <AdminPanel />
            </PrivateRoute>
          }
        />

        {/* Rutas privadas del paciente */}
        <Route
          path="/paciente/completar-perfil"
          element={
            <PrivateRoute>
              <CompletarPerfil />
            </PrivateRoute>
          }
        />

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