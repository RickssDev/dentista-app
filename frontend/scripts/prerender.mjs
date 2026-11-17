// Prerender de las páginas públicas (spec 022, ADR 0009). Corre después de los dos builds de Vite:
// escribe una página HTML por ruta pública, la 404, el armazón de la SPA, robots.txt y sitemap.xml.
// El build falla si una página queda sin h1, título, descripción, canónica o el CSS de su ruta.
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { construirPagina, estilosDeRuta, paginaLogin } from "../src/seo/cabecera.js";
import { generarRobots, generarSitemap } from "../src/seo/archivos.js";
import { datosDeSesion, hostsProhibidos, modulosPrivadosEnEntrada } from "../src/seo/guardas.js";
import { MODULOS_PRIVADOS, RUTAS_PUBLICAS, TITULO_404, canonica } from "../src/seo/rutas.js";

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

// Spec 023 · CA4: el código del login, el panel y el portal no pesa en las páginas públicas
for (const modulo of modulosPrivadosEnEntrada(manifiesto, MODULOS_PRIVADOS)) {
  exigir(false, `${modulo}: forma parte del JavaScript de entrada (debe cargarse bajo demanda)`);
}

// Spec 023 · CA1, CA2: precarga del woff2 latino de cada fuente y de la foto principal
const ASSETS = readdirSync(join(DIST, "assets"));
const fuente = (familia) => {
  const archivo = ASSETS.find((a) => new RegExp(`^${familia}-latin-wght-normal-[\\w-]+\\.woff2$`).test(a));
  exigir(Boolean(archivo), `sin el woff2 latino de ${familia} en dist/assets`);
  return archivo ? [{ href: `/assets/${archivo}`, as: "font", type: "font/woff2" }] : [];
};
const FUENTE_SITIO = fuente("plus-jakarta-sans");
const FUENTE_LOGIN = fuente("jost");

// La foto principal sale del propio HTML: el <img> con fetchPriority="high" (SmartImage con priority)
const atributo = (etiqueta, nombre) =>
  (etiqueta.match(new RegExp(`\\s${nombre}="([^"]*)"`, "i")) || [])[1]?.replace(/&amp;/g, "&");
const fotoPrincipal = (cuerpo) => {
  const img = (cuerpo.match(/<img\b[^>]*fetchPriority="high"[^>]*>/i) || [])[0];
  if (!img) return [];
  return [{ href: atributo(img, "src"), as: "image", srcset: atributo(img, "srcSet"), sizes: atributo(img, "sizes") }];
};
const precargaDeFuente = (html, precargas) =>
  precargas.every(({ href }) => html.includes(`<link rel="preload" href="${href}" as="font"`));

for (const { ruta, titulo, descripcion, modulo } of RUTAS_PUBLICAS) {
  const todos = modulo ? estilosDeRuta(manifiesto, modulo) : [];
  const css = todos.filter((hoja) => !plantilla.includes(`href="${hoja}"`));
  const cuerpo = await render(ruta);
  const html = construirPagina(plantilla, { cuerpo, ruta, css, precargas: [...FUENTE_SITIO, ...fotoPrincipal(cuerpo)] });
  exigir(FUENTE_SITIO.length > 0 && precargaDeFuente(html, FUENTE_SITIO), `${ruta}: sin la precarga de la fuente`);

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
  // Spec 023 · CA7, CA8: nada de servicios externos al cargar
  for (const host of hostsProhibidos(html)) exigir(false, `${ruta}: referencia ${host}`);

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

// Spec 023: el login llega ya pintado, fuera de los buscadores y sin restos de sesión (TM1)
const login = paginaLogin(plantilla, {
  cuerpo: await render("/login"),
  css: estilosNuevos("src/pages/admin/login.jsx"),
  precargas: FUENTE_LOGIN,
});
exigir(FUENTE_LOGIN.length > 0 && precargaDeFuente(login, FUENTE_LOGIN), "login.html: sin la precarga de la fuente");
exigir(/id="login-correo"/.test(login), "login.html: sin el formulario de acceso");
exigir(/<meta name="robots" content="noindex"/.test(login), "login.html: sin noindex");
exigir(!/rel="canonical"/.test(login), "login.html: no puede llevar canónica");
for (const dato of datosDeSesion(login)) exigir(false, `login.html: contiene datos de sesión (${dato.slice(0, 12)}…)`);
for (const host of hostsProhibidos(login)) exigir(false, `login.html: referencia ${host}`);
escribir("login.html", login);

escribir("robots.txt", generarRobots());
escribir("sitemap.xml", generarSitemap());

// El manifiesto solo sirve al prerender: no se publica
rmSync(join(DIST, ".vite"), { recursive: true, force: true });

if (errores.length) {
  console.error(`Prerender incompleto:\n- ${errores.join("\n- ")}`);
  process.exit(1);
}
console.log(`Prerender: ${RUTAS_PUBLICAS.length} páginas públicas, login, 404, app.html, robots.txt y sitemap.xml`);
