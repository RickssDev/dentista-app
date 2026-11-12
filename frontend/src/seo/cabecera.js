// Arma el HTML final de cada página prerenderizada (spec 022): el contenido dentro de #root y, en el
// <head>, título, descripción, canónica, Open Graph, robots, JSON-LD y el CSS de la ruta.
import { generarNegocioLocal, serializarJsonLd } from "./negocioLocal.js";
import { RUTAS_PUBLICAS, SITIO, canonica } from "./rutas.js";

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
    `<meta name="twitter:card" content="summary_large_image">`,
  ];
};

/**
 * @param {string} plantilla  index.html de la build (con <title>, descripción y <div id="root">)
 * @param {object} opciones
 *   cuerpo   HTML prerenderizado para #root
 *   ruta     ruta pública de la tabla (con título, descripción y canónica)
 *   noindex  página que no debe indexarse (armazón de la SPA, 404)
 *   titulo   título para una página sin ruta pública (p. ej. la 404)
 *   css      hojas de estilo de la ruta, en rutas absolutas
 */
export const construirPagina = (plantilla, { cuerpo = "", ruta, noindex = false, titulo, css = [] } = {}) => {
  const datos = ruta ? RUTAS_PUBLICAS.find((r) => r.ruta === ruta) : null;
  if (ruta && !datos) throw new Error(`La ruta ${ruta} no está en la tabla de rutas públicas`);

  let html = plantilla;
  const tituloFinal = datos?.titulo || titulo;
  if (tituloFinal) html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapar(tituloFinal)}</title>`);
  if (datos) {
    html = html.replace(
      /<meta name="description" content="[^"]*"\s*\/?>/,
      `<meta name="description" content="${escapar(datos.descripcion)}" />`,
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

  if (cabecera.length) html = html.replace("</head>", `    ${cabecera.join("\n    ")}\n  </head>`);
  return html.replace(/<div id="root"><\/div>/, `<div id="root">${cuerpo}</div>`);
};
