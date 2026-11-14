// robots.txt y sitemap.xml generados desde la tabla de rutas públicas (spec 022).
import { RUTAS_PUBLICAS, SITIO, canonica } from "./rutas.js";

// Sin Disallow: las rutas privadas deben poder rastrearse para leer su noindex
export const generarRobots = () =>
  ["User-agent: *", "Allow: /", "", `Sitemap: ${SITIO}/sitemap.xml`, ""].join("\n");

export const generarSitemap = () =>
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...RUTAS_PUBLICAS.map(({ ruta }) => `  <url><loc>${canonica(ruta)}</loc></url>`),
    "</urlset>",
    "",
  ].join("\n");
