import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { DESCRIPCION_GENERAL, RUTAS_PUBLICAS, TITULO_404, TITULO_GENERAL, canonica } from "../../seo/rutas";

// Asegura una etiqueta en el <head> y le pone el atributo indicado
const etiqueta = (selector, crear, atributo, valor) => {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = crear();
    document.head.appendChild(el);
  }
  el.setAttribute(atributo, valor);
};

const ponerDescripcion = (texto) =>
  etiqueta(
    'meta[name="description"]',
    () => Object.assign(document.createElement("meta"), { name: "description" }),
    "content",
    texto,
  );

const quitarCanonica = () => document.head.querySelector('link[rel="canonical"]')?.remove();

/**
 * Al navegar dentro de la SPA, pone el título, la descripción y la canónica de la página pública
 * actual (spec 022). No pinta nada: el HTML prerenderizado ya trae estos datos al cargar.
 * Una ruta del Layout fuera de la tabla es la 404; al salir del Layout (login, paneles) vuelven
 * los metadatos generales, para no dejar el título de la página anterior (WCAG 2.4.2).
 */
export default function Metadatos() {
  const { pathname } = useLocation();

  useEffect(() => {
    const datos = RUTAS_PUBLICAS.find((r) => r.ruta === pathname);
    if (!datos) {
      document.title = TITULO_404;
      quitarCanonica();
      return;
    }

    document.title = datos.titulo;
    ponerDescripcion(datos.descripcion);
    etiqueta(
      'link[rel="canonical"]',
      () => Object.assign(document.createElement("link"), { rel: "canonical" }),
      "href",
      canonica(datos.ruta),
    );
  }, [pathname]);

  useEffect(
    () => () => {
      document.title = TITULO_GENERAL;
      ponerDescripcion(DESCRIPCION_GENERAL);
      quitarCanonica();
    },
    [],
  );

  return null;
}
