// Configuración central de la API
export const BASE_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000/api/v1"
).replace(/\/+$/, "");

// Compatible con URL relativa y absoluta
export const BASE_ORIGIN = new URL(
  BASE_URL,
  window.location.origin
).origin;

// URL para archivos e imágenes
export const ASSETS_URL = (
  import.meta.env.VITE_ASSETS_URL ||
  BASE_ORIGIN
).replace(/\/+$/, "");

// Rutas donde un 401 significa "credenciales incorrectas", no "sesión vencida"
const RUTAS_SIN_SESION = [
  "/auth/login",
  "/auth/register",
  "/auth/google/login",
  "/auth/google/register",
];

const limpiarSesion = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("rol");
  localStorage.removeItem("tienePerfilPaciente");
  sessionStorage.clear();
};

// Token vencido, inválido o cuenta desactivada: se limpia la sesión y se manda al login
const manejarSesionVencida = (endpoint, status) => {
  if (
    status !== 401 ||
    RUTAS_SIN_SESION.some((ruta) => endpoint.startsWith(ruta))
  ) {
    return;
  }

  limpiarSesion();

  if (window.location.pathname !== "/login") {
    window.location.replace("/login");
  }
};

export const api = async (
    endpoint,
    method = "GET",
    data = null,
    isFormData = false
  ) => {
    const token = localStorage.getItem("token");

    const options = {
      method,
      headers: {}
    };

    if (token) {
      options.headers["Authorization"] =
        `Bearer ${token}`;
    }

    if (data) {
      if (isFormData) {
        options.body = data;
      } else {
        options.headers["Content-Type"] =
          "application/json";
        options.body = JSON.stringify(data);
      }
    }

    const response = await fetch(
      `${BASE_URL}${endpoint}`,
      options
    );

    let result;

    try {
      result = await response.json();
    } catch {
      result = {};
    }

    if (!response.ok) {
      manejarSesionVencida(endpoint, response.status);

      throw new Error(
        result.message ||
        "Error interno del servidor"
      );
    }

    return result;
  };

export const apiDescargar = async (ruta) => {
  const token = localStorage.getItem("token");

  const options = {
    method: "GET",
    headers: {}
  };

  if (token) {
    options.headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${ruta}`, options);

  if (!res.ok) {
    manejarSesionVencida(ruta, res.status);

    const body = await res.json().catch(() => null);
    throw new Error(body?.message || "No se pudo descargar el archivo");
  }

  return res.blob();
};

export const getImageUrl = (img, placeholder = "https://via.placeholder.com/60") => {
  if (!img) return placeholder;
  if (img.startsWith("http")) return img;
  return `${BASE_ORIGIN}/${img.replace(/^\/+/, "")}`;
};