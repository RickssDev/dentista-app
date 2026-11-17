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

/** Hosts prohibidos que aparecen en el HTML. */
export const hostsProhibidos = (html) => HOSTS_PROHIBIDOS.filter((host) => html.includes(host));

// Claves del manifiesto que index.html carga de forma estática (su cierre de `imports`)
const cierreEstatico = (manifiesto) => {
  const vistos = new Set();
  const visitar = (clave) => {
    if (vistos.has(clave) || !manifiesto[clave]) return;
    vistos.add(clave);
    for (const importada of manifiesto[clave].imports || []) visitar(importada);
  };
  visitar("index.html");
  return vistos;
};

/**
 * Módulos privados que pesan en la entrada: no son entrada dinámica del manifiesto (un módulo
 * incrustado en otro chunk no tiene clave propia) o su chunk está en el cierre de importaciones
 * estáticas de index.html.
 */
export const modulosPrivadosEnEntrada = (manifiesto, modulos) => {
  const estaticos = cierreEstatico(manifiesto);
  return modulos.filter((modulo) => !manifiesto[modulo]?.isDynamicEntry || estaticos.has(modulo));
};

const JWT = /eyJ[\w-]{5,}\.[\w-]{5,}/g;
const PALABRA_TOKEN = /["']token["']/gi;
const CORREO = /[\w.+-]+@[\w-]+\.[\w.-]+/g;

/**
 * Restos de sesión en un HTML generado: tokens JWT, la palabra "token" entre comillas o correos en
 * el texto o en un `value` (TM1). Los `placeholder` no cuentan: el login muestra "tu@correo.com".
 */
export const datosDeSesion = (html) => {
  const sinEjemplos = html.replace(/\splaceholder="[^"]*"/gi, "");
  return [JWT, PALABRA_TOKEN, CORREO].flatMap((patron) => sinEjemplos.match(patron) || []);
};
