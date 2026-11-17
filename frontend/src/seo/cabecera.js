// Arma el HTML final de cada página prerenderizada (spec 022): el contenido dentro de #root y, en el
// <head>, título, descripción, canónica, Open Graph, robots, JSON-LD y el CSS de la ruta.
import { generarNegocioLocal, serializarJsonLd } from "./negocioLocal.js";
import { RUTAS_PUBLICAS, SITIO, TITULO_LOGIN, canonica } from "./rutas.js";

const IMAGEN_COMPARTIR = `${SITIO}/og-dentissa.jpg`;

const escapar = (texto) =>
  String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// CSS de un módulo del manifiesto de Vite y de lo que importa, sin repetir
export const estilosDeRuta = (manifiesto, modulo, vistos = new Set()) => {
  const entrada = manifiesto?.[modulo];
  if (!entrada || vistos.has(modulo)) return [];
  vistos.add(modulo);
  const propios = (entrada.css || []).map((archivo) => `/${archivo}`);
  const importados = (entrada.imports || []).flatMap((m) => estilosDeRuta(manifiesto, m, vistos));
  return [...new Set([...propios, ...importados])];
};

const etiquetasIndexables = (datos) => {
  const url = canonica(datos.ruta);
  const titulo = escapar(datos.titulo);
  const descripcion = escapar(datos.descripcion);
  return [
    `<link rel="canonical" href="${url}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="Dentissa">`,
    `<meta property="og:locale" content="es_MX">`,
    `<meta property="og:title" content="${titulo}">`,
    `<meta property="og:description" content="${descripcion}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:image" content="${IMAGEN_COMPARTIR}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta property="og:image:alt" content="Logo de Dentissa Clínica Dental sobre la foto de su consultorio">`,
    `<meta name="twitter:card" content="summary_large_image">`,
  ];
};

/**
 * Página del login prerenderizado (spec 023): noindex, su título y el CSS de su chunk; sin
 * canónica, Open Graph ni JSON-LD. La usan scripts/prerender.mjs y las pruebas.
 */
export const paginaLogin = (plantilla, { cuerpo = "", css = [], precargas = [] } = {}) =>
  construirPagina(plantilla, { cuerpo, noindex: true, titulo: TITULO_LOGIN, css, precargas });

// <link rel="preload"> de una fuente (con crossorigin, obligatorio para fuentes) o de la foto
// principal (prioridad alta y, si la hay, su lista de tamaños) (spec 023)
const precarga = ({ href, as, type, srcset, sizes }) => {
  const extra =
    as === "font"
      ? ` type="${escapar(type || "font/woff2")}" crossorigin`
      : ` fetchpriority="high"${srcset ? ` imagesrcset="${escapar(srcset)}"` : ""}${sizes ? ` imagesizes="${escapar(sizes)}"` : ""}`;
  return `<link rel="preload" href="${escapar(href)}" as="${escapar(as)}"${extra}>`;
};

/**
 * @param {string} plantilla  index.html de la build (con <title>, descripción y <div id="root">)
 * @param {object} opciones
 *   cuerpo   HTML prerenderizado para #root
 *   ruta     ruta pública de la tabla (con título, descripción y canónica)
 *   noindex  página que no debe indexarse (armazón de la SPA, 404)
 *   titulo   título para una página sin ruta pública (p. ej. la 404)
 *   css      hojas de estilo de la ruta, en rutas absolutas
 *   precargas recursos que el navegador debe pedir cuanto antes: { href, as: "font"|"image", type, srcset, sizes }
 */
export const construirPagina = (plantilla, { cuerpo = "", ruta, noindex = false, titulo, css = [], precargas = [] } = {}) => {
  const datos = ruta ? RUTAS_PUBLICAS.find((r) => r.ruta === ruta) : null;
  if (ruta && !datos) throw new Error(`La ruta ${ruta} no está en la tabla de rutas públicas`);

  // Reemplazos con función: una cadena interpretaría $&, $` y $' del contenido (review R10)
  const reemplazar = (html, patron, texto, falta) => {
    if (!patron.test(html)) throw new Error(`La plantilla no tiene ${falta}`);
    return html.replace(patron, () => texto);
  };

  let html = plantilla;
  const tituloFinal = datos?.titulo || titulo;
  if (tituloFinal) html = reemplazar(html, /<title>[\s\S]*?<\/title>/, `<title>${escapar(tituloFinal)}</title>`, "<title>");
  if (datos) {
    html = reemplazar(
      html,
      /<meta name="description" content="[^"]*"\s*\/?>/,
      `<meta name="description" content="${escapar(datos.descripcion)}" />`,
      'meta name="description"',
    );
  }

  const cabecera = [
    ...(noindex ? ['<meta name="robots" content="noindex">'] : []),
    ...(datos && !noindex ? etiquetasIndexables(datos) : []),
    ...(datos?.ruta === "/" && !noindex
      ? [`<script type="application/ld+json">${serializarJsonLd(generarNegocioLocal())}</script>`]
      : []),
    ...css.map((archivo) => `<link rel="stylesheet" href="${escapar(archivo)}">`),
  ];

  // Las precargas van justo tras el charset: antes que cualquier hoja de estilo o script
  if (precargas.length) {
    const charset = /<meta charset="[^"]*"\s*\/?>/i;
    const inicio = (html.match(charset) || [""])[0];
    html = reemplazar(html, charset, `${inicio}\n    ${precargas.map(precarga).join("\n    ")}`, "meta charset");
  }

  if (cabecera.length) html = reemplazar(html, /<\/head>/, `    ${cabecera.join("\n    ")}\n  </head>`, "</head>");
  return reemplazar(html, /<div id="root"><\/div>/, `<div id="root">${cuerpo}</div>`, '<div id="root"></div>');
};
