// Prerender de las páginas públicas (spec 022, ADR 0009). Corre después de los dos builds de Vite:
// escribe una página HTML por ruta pública, la 404, el armazón de la SPA, robots.txt y sitemap.xml.
// El build falla si una página queda sin h1, título, descripción, canónica o el CSS de su ruta.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { construirPagina, estilosDeRuta } from "../src/seo/cabecera.js";
import { generarRobots, generarSitemap } from "../src/seo/archivos.js";
import { RUTAS_PUBLICAS, TITULO_404, canonica } from "../src/seo/rutas.js";

const CARPETA = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(CARPETA, "dist");
const { render } = await import(pathToFileURL(join(CARPETA, "dist-ssr", "entry-prerender.js")).href);

const plantilla = readFileSync(join(DIST, "index.html"), "utf8");

if (!plantilla.includes('<div id="root"></div>')) {
  console.error("dist/index.html ya está prerenderizado: ejecuta el build completo (npm run build).");
  process.exit(1);
}

const manifiesto = JSON.parse(readFileSync(join(DIST, ".vite", "manifest.json"), "utf8"));

// CSS de la ruta que la plantilla todavía no enlaza
const estilosNuevos = (modulo) => estilosDeRuta(manifiesto, modulo).filter((hoja) => !plantilla.includes(`href="${hoja}"`));

const errores = [];
const exigir = (condicion, mensaje) => {
  if (!condicion) errores.push(mensaje);
};

const escribir = (archivo, contenido) => {
  const destino = join(DIST, archivo);
  mkdirSync(dirname(destino), { recursive: true });
  writeFileSync(destino, contenido);
};

const contenidoDe = (html, patron) => (html.match(patron) || [])[1];

for (const { ruta, titulo, descripcion, modulo } of RUTAS_PUBLICAS) {
  const todos = modulo ? estilosDeRuta(manifiesto, modulo) : [];
  const css = todos.filter((hoja) => !plantilla.includes(`href="${hoja}"`));
  const html = construirPagina(plantilla, { cuerpo: await render(ruta), ruta, css });

  exigir(/<h1[\s>]/.test(html), `${ruta}: sin h1`);
  exigir(contenidoDe(html, /<title>([^<]*)<\/title>/) === titulo, `${ruta}: título distinto del de la tabla`);
  exigir(descripcion.length >= 70 && descripcion.length <= 160, `${ruta}: descripción fuera de 70–160 caracteres`);
  // Sobre el HTML final, no sobre la tabla: si la plantilla cambia, aquí se nota (review R7)
  exigir(
    contenidoDe(html, /<meta name="description" content="([^"]*)"/) === descripcion,
    `${ruta}: la descripción del HTML no es la de la tabla`,
  );
  exigir((html.match(/rel="canonical"/g) || []).length === 1, `${ruta}: no tiene exactamente una canónica`);
  exigir(contenidoDe(html, /<link rel="canonical" href="([^"]+)">/) === canonica(ruta), `${ruta}: sin canónica correcta`);
  exigir(!modulo || todos.length > 0, `${ruta}: sin el CSS de ${modulo} en el manifiesto`);
  for (const hoja of todos) exigir(html.includes(`href="${hoja}"`), `${ruta}: no enlaza ${hoja}`);

  escribir(ruta === "/" ? "index.html" : join(ruta.slice(1), "index.html"), html);
}

// La página "no encontrada" (NotFound vive en Legal.jsx) y el armazón de las rutas privadas
escribir(
  "404.html",
  construirPagina(plantilla, {
    cuerpo: await render("/ruta-que-no-existe"),
    noindex: true,
    titulo: TITULO_404,
    css: estilosNuevos("src/pages/Legal.jsx"),
  }),
);
escribir("app.html", construirPagina(plantilla, { noindex: true }));
escribir("robots.txt", generarRobots());
escribir("sitemap.xml", generarSitemap());

// El manifiesto solo sirve al prerender: no se publica
rmSync(join(DIST, ".vite"), { recursive: true, force: true });

if (errores.length) {
  console.error(`Prerender incompleto:\n- ${errores.join("\n- ")}`);
  process.exit(1);
}
console.log(`Prerender: ${RUTAS_PUBLICAS.length} páginas públicas, 404, app.html, robots.txt y sitemap.xml`);
