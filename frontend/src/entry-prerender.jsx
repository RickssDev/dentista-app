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
    // Sin límite de tamaño, React escribe cada sección de Suspense en su sitio. Si no, las grandes
    // (portada, contacto) salen ocultas al final y aparecen al correr un script (R3)
    { progressiveChunkSize: Number.POSITIVE_INFINITY },
  );
  return new Response(prelude).text();
}
