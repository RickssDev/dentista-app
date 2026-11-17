// Comprobaciones del HTML y del manifiesto de Vite que hacen fallar el build (spec 023, ADR 0010).
// Son funciones puras: scripts/prerender.mjs las aplica y tests/rendimiento-guardas.test.js las prueba.

// Servicios externos que ninguna de las siete páginas puede pedir al cargar (CA5, CA7, CA8)
export const HOSTS_PROHIBIDOS = [
  "fonts.googleapis.com",
  "fonts.gstatic.com",
  "images.unsplash.com",
  "accounts.google.com",
  "maps.google.com",
  "maps.googleapis.com",
];

const sinImplementar = () => {
  throw new Error("sin implementar");
};

/** Hosts prohibidos que aparecen en el HTML. */
export const hostsProhibidos = (html) => sinImplementar(html);

/**
 * Módulos privados que pesan en la entrada: no son entrada dinámica del manifiesto o su chunk está
 * en el cierre de importaciones estáticas de index.html.
 */
export const modulosPrivadosEnEntrada = (manifiesto, modulos) => sinImplementar(manifiesto, modulos);

/** Restos de sesión en un HTML generado: tokens JWT, la palabra "token" entre comillas o correos (TM1). */
export const datosDeSesion = (html) => sinImplementar(html);
