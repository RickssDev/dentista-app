// Entrada del prerender (spec 022, ADR 0009): pinta una ruta a HTML en el build, esperando a las
// páginas cargadas bajo demanda. Las secciones con datos de la API quedan en su estado inicial.
import { prerender } from "react-dom/static";
import { StaticRouter } from "react-router-dom";
import { AppRoutes } from "./App.jsx";

export async function render(url) {
  const { prelude } = await prerender(
    <StaticRouter location={url}>
      <AppRoutes />
    </StaticRouter>,
  );
  return new Response(prelude).text();
}
