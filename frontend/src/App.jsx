import { lazy, Suspense } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Layout from "./components/home/Layout";
import Home from "./pages/Home";

import "./styles/home/global.css";

const MARCA_RECARGA = "dentissa:recarga-chunk";
const almacen = () => (typeof sessionStorage === "undefined" ? null : sessionStorage);

/**
 * Carga una página bajo demanda (spec 023). Si el archivo ya no existe, porque la pestaña quedó
 * abierta con la versión anterior tras un despliegue, recarga la página una sola vez para tomar la
 * nueva; si vuelve a fallar, propaga el error en lugar de recargar en bucle.
 */
// eslint-disable-next-line react-refresh/only-export-components -- utilidad del enrutado, probada aparte
export const cargarPagina = (importar, recargar = () => window.location.reload()) => () =>
  importar()
    .then((modulo) => {
      almacen()?.removeItem(MARCA_RECARGA);
      return modulo;
    })
    .catch((error) => {
      const marca = almacen();
      if (!marca || marca.getItem(MARCA_RECARGA)) throw error;
      marca.setItem(MARCA_RECARGA, "1");
      recargar();
      return new Promise(() => {});
    });

// Login, panel, portal y restablecer contraseña: fuera del JavaScript de las páginas públicas
const Login = lazy(cargarPagina(() => import("./pages/admin/login")));
const AdminPanel = lazy(cargarPagina(() => import("./pages/admin/AdminPanel")));
const InicioPaciente = lazy(cargarPagina(() => import("./pages/paciente/InicioPaciente")));
const CitasPaciente = lazy(cargarPagina(() => import("./pages/paciente/CitasPaciente")));
const PerfilPaciente = lazy(cargarPagina(() => import("./pages/paciente/PerfilPaciente")));
const CompletarPerfil = lazy(cargarPagina(() => import("./pages/paciente/CompletarPerfil")));
const RestablecerContrasena = lazy(cargarPagina(() => import("./pages/admin/RestablecerContrasena")));

const Cargando = ({ children }) => <Suspense fallback={<p>Cargando página...</p>}>{children}</Suspense>;

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

// Rutas de la aplicación; el prerender las usa con StaticRouter (spec 022)
export function AppRoutes() {
  return (
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
        <Route path="/login" element={<Cargando><Login /></Cargando>} />
        {/* Recuperación de contraseña: ruta pública */}
        <Route
          path="/restablecer-contrasena"
          element={<Cargando><RestablecerContrasena /></Cargando>}
        />

        {/* Rutas privadas del administrador */}
        <Route
          path="/admin/*"
          element={
            <PrivateRoute>
              <Cargando><AdminPanel /></Cargando>
            </PrivateRoute>
          }
        />

        {/* Rutas privadas del paciente */}
        <Route
          path="/paciente/completar-perfil"
          element={
            <PrivateRoute>
              <Cargando><CompletarPerfil /></Cargando>
            </PrivateRoute>
          }
        />

        <Route
          path="/paciente"
          element={
            <PrivateRoute>
              <Cargando><InicioPaciente /></Cargando>
            </PrivateRoute>
          }
        />

        <Route
          path="/paciente/citaspaciente"
          element={
            <PrivateRoute>
              <Cargando><CitasPaciente /></Cargando>
            </PrivateRoute>
          }
        />

        <Route
          path="/paciente/perfil"
          element={
            <PrivateRoute>
              <Cargando><PerfilPaciente /></Cargando>
            </PrivateRoute>
          }
        />
      </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;