import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { RUTAS_PUBLICAS, canonica } from "../../seo/rutas";

// Asegura una etiqueta en el <head> y le pone el atributo indicado
const etiqueta = (selector, crear, atributo, valor) => {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = crear();
    document.head.appendChild(el);
  }
  el.setAttribute(atributo, valor);
};

/**
 * Al navegar dentro de la SPA, pone el título, la descripción y la canónica de la página pública
 * actual (spec 022). No pinta nada: el HTML prerenderizado ya trae estos datos al cargar.
 */
export default function Metadatos() {
  const { pathname } = useLocation();

  useEffect(() => {
    const datos = RUTAS_PUBLICAS.find((r) => r.ruta === pathname);
    if (!datos) return;

    document.title = datos.titulo;
    etiqueta(
      'meta[name="description"]',
      () => Object.assign(document.createElement("meta"), { name: "description" }),
      "content",
      datos.descripcion,
    );
    etiqueta(
      'link[rel="canonical"]',
      () => Object.assign(document.createElement("link"), { rel: "canonical" }),
      "href",
      canonica(datos.ruta),
    );
  }, [pathname]);

  return null;
}
