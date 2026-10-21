// ─────────────────────────────────────────────────────────────
// Configuración de la API pública
// Ajusta VITE_API_URL en tu archivo .env  (ej. VITE_API_URL=http://localhost:3000/api/v1)
// y, si tus routers están montados con otro prefijo, cambia las rutas de abajo.
// ─────────────────────────────────────────────────────────────

export const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1").replace(/\/+$/, "");
export const BASE_ORIGIN = new URL(BASE_URL).origin;
// Origen del servidor para resolver imágenes con ruta relativa (ej. "/uploads/foto.jpg")
 export const ASSETS_URL = (
    import.meta.env.VITE_ASSETS_URL || BASE_ORIGIN).replace(/\/+$/, "");

export const ENDPOINTS = {
  servicios: "/servicios/publicos",
  promociones: "/promociones/publicos",
  comentarios: "/comentarios/publicos",
  faqs: "/faqs",
  imagenes: "/imagenes/publicas",
  // Aún no existe en el backend: la página muestra "Próximamente" hasta que la crees.
  certificaciones: "/certificaciones/publicas",
};
