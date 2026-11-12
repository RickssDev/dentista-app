---
id: 022
slug: sitio-indexable
status: implemented
created: 2026-11-12
extends: [017]
---

# 022 · Sitio indexable

## Problema
Las seis páginas públicas de Dentissa llegan a los buscadores como una página vacía que se dibuja
después con JavaScript: todas comparten el mismo título y la misma descripción, no hay instrucciones
para rastreadores ni mapa del sitio, el inicio de sesión, los paneles privados y las direcciones
inexistentes aparecen como páginas válidas, y no hay datos de la clínica que los buscadores puedan
leer. Lighthouse da 92 en SEO y a la clínica le cuesta aparecer al buscar "Dentissa". Atiende las
brechas SE1 a SE7 de `docs/seo.md` **parcialmente**: el ícono vectorial (SE7.b) espera un logo
en SVG. Cierra el objetivo 4 del roadmap.

## Historias de usuario
- H1 · Como clínica, quiero que los buscadores lean y entiendan cada página pública, para aparecer
  cuando alguien busca "Dentissa" o una clínica dental en la zona.
- H2 · Como clínica, quiero que las páginas privadas y las direcciones que no existen no aparezcan
  en los buscadores, para que nadie llegue a un panel o a una página rota desde un resultado.
- H3 · Como paciente que comparte el sitio, quiero que el enlace muestre una vista previa con
  título, descripción e imagen.

## Criterios de aceptación
**Páginas públicas (H1)** — inicio, nosotros, galería, contacto, aviso de privacidad y términos
- [x] CA1 · Dada cualquiera de las seis páginas públicas, cuando se audita con Lighthouse en su
  categoría SEO, entonces obtiene 100.
- [x] CA2 · Dada una página pública, cuando un rastreador la pide sin ejecutar JavaScript, entonces
  recibe su encabezado principal y sus textos propios (no una página vacía); las secciones que
  dependen de datos del sistema (servicios, promociones, reseñas, galería, preguntas) pueden
  completarse después en el navegador.
- [x] CA3 · Dadas las seis páginas públicas, entonces cada una tiene un título y una descripción
  propios, distintos entre sí; el título incluye "Dentissa" y la descripción tiene entre 70 y 160
  caracteres.
- [x] CA4 · Dada una página pública, entonces declara como dirección oficial su URL absoluta en
  `https://sistema.dentissa.app`, sin barra final.
- [x] CA5 · Dado un rastreador, cuando pide las instrucciones para rastreadores del sitio, entonces
  recibe un archivo de texto válido que permite rastrear las páginas públicas e indica la dirección
  absoluta del mapa del sitio.
- [x] CA6 · Dado un rastreador, cuando pide el mapa del sitio, entonces recibe uno válido con
  exactamente las seis páginas públicas, con su dirección absoluta.
- [x] CA7 · Dada la portada, entonces incluye, en el formato de negocio local que entienden los
  buscadores, el nombre de la clínica, su dirección separada en calle, ciudad, estado, código
  postal y país, su teléfono, su horario de atención, su sitio web y una imagen, tomados de la
  misma fuente de datos que muestra el sitio; si el horario de esa fuente no se puede
  interpretar, la publicación del sitio se detiene con un aviso en lugar de publicar un horario
  equivocado.

**Páginas que no deben aparecer (H2)**
- [x] CA8 · Dadas las páginas de inicio de sesión, restablecer contraseña, los paneles del personal
  y del paciente, y la página de "no encontrada", entonces piden a los buscadores no indexarlas y no
  aparecen en el mapa del sitio.
- [x] CA9 · Dada una dirección que no existe, cuando se pide, entonces el servidor responde
  "no encontrada" (404) y muestra la página de error propia del sitio.
- [x] CA10 · (abuso) Dado el contenido que se genera para los rastreadores, entonces no incluye
  datos de pacientes, del personal, de citas ni de ninguna pantalla que requiere sesión.

**Compartir e íconos (H3)**
- [x] CA11 · Dada una página pública, cuando se comparte su enlace, entonces la vista previa usa su
  título y su descripción, y una imagen general de 1200×630 de la clínica.
- [x] CA12 · Dado un navegador o un dispositivo, entonces el sitio ofrece su ícono en PNG de 32,
  192 y 512 px y un ícono de 180 px para la pantalla de inicio de los teléfonos, todos a partir del
  logo actual.

**Sin regresiones**
- [x] CA13 · Dadas las páginas públicas y las privadas, entonces se ven y funcionan como antes:
  navegación, inicio de sesión, paneles, formulario de contacto y secciones con datos del sistema.

## Fuera de alcance
- Alta del sitio en Google Search Console y envío del mapa del sitio: lo hace el usuario con su
  cuenta (pendiente operativo de `docs/seo.md`).
- Perfil de Google Business de la clínica: lo hace el usuario.
- Mover el sitio a otro dominio: sigue en `sistema.dentissa.app`.
- Palabras clave, textos nuevos para posicionar y enlaces externos.
- Confirmar la dirección y el teléfono reales: se usan los del sitio como provisionales.
- Rediseñar las páginas o crear contenido nuevo.

## Seguridad y privacidad
- Datos sensibles involucrados: ninguno nuevo. Se publican los datos de contacto de la clínica, que
  ya son públicos en el sitio.
- Quién puede hacer qué: cualquier visitante y rastreador lee las páginas públicas; las privadas
  siguen exigiendo sesión.
- Casos de abuso:
  - Como rastreador, intento obtener contenido de páginas privadas desde el contenido generado o el
    mapa del sitio → no hay nada privado en ellos (CA8, CA10).

## Cobertura de riesgos
| Corrección | Alcance | Criterios / motivo y destino |
|---|---|---|
| SE1.a — Prerenderizar o renderizar en servidor las 6 rutas públicas, con ADR | dentro | CA2, CA13 |
| SE1.b — Título y descripción únicos por ruta indexable | dentro | CA1, CA3 |
| SE2.a — Generar `robots.txt` con la URL absoluta del sitemap | dentro | CA1, CA5 |
| SE2.b — Generar `sitemap.xml` con las 6 rutas indexables | dentro | CA6 |
| SE3.a — Responder 404 real a las URL inexistentes | dentro | CA9 |
| SE3.b — Aplicar `noindex` a login, restablecer contraseña, `/admin/*`, `/paciente/*` y a la 404 | dentro | CA8 |
| SE4.a — Canónica absoluta por ruta desde `seo.site_url` | dentro | CA4 |
| SE5.a — Open Graph por ruta indexable | dentro | CA11 |
| SE5.b — Imagen general de 1200×630 | dentro | CA11 |
| SE6.a — Añadir datos de negocio local de la clínica en la portada | dentro | CA7 |
| SE7.a — Añadir íconos PNG (`favicon-32.png`, 192, 512) y `apple-touch-icon.png` | dentro | CA12 |
| SE7.b — Añadir `favicon.svg` desde un logo vectorial | fuera | No hay logo vectorial (decisión del usuario, 2026-11-12) → pendiente en `docs/seo.md` hasta tenerlo |

## Auditoría
No aplica: la spec no toca datos sensibles, autenticación ni permisos.

## Diseño
No aplica: sin cambios visuales en las páginas. La imagen para compartir se compone con recursos
que ya existen (logo y una foto del sitio), sin textos ni piezas nuevas, y los íconos salen del
logo actual ([docs/design/system.md](../../design/system.md)).

## Requisitos no funcionales
- Descubribilidad (`docs/seo.md`): indexables solo las seis páginas públicas, cada una con título,
  descripción, dirección oficial y vista previa propios; no indexables el inicio de sesión,
  restablecer contraseña, los paneles y la página de "no encontrada".
- Rendimiento: las páginas públicas no cargan más lento que hoy (Lighthouse Rendimiento de la
  portada igual o mayor que antes del cambio, medido sobre la build).
- Accesibilidad: sin regresiones (WCAG 2.1 AA de la constitución).

## Preguntas abiertas
Ninguna.

## Decisiones
| Fecha | Tipo | Pregunta / conflicto | Decisión | Fuente |
|---|---|---|---|---|
| 2026-11-12 | brecha | ¿Alcance: solo Lighthouse 100 o sitio indexable completo? | Completo: SE1 a SE7 | usuario |
| 2026-11-12 | brecha | ¿Prerenderizar las páginas públicas en esta spec? | Sí | usuario |
| 2026-11-12 | brecha | ¿Dominio del sitio público? | Sigue en `https://sistema.dentissa.app` | usuario |
| 2026-11-12 | supuesto | La dirección y el teléfono del sitio no están confirmados | Se usan los del sitio como provisionales; salen de una sola fuente para cambiarlos en un lugar. Riesgo: los buscadores pueden mostrar datos no confirmados hasta corregirlos | usuario |
| 2026-11-12 | brecha | ¿Una spec o dos (prerender aparte)? | Una sola, con 13 criterios: el usuario pidió incluir el prerender | usuario |
| 2026-11-12 | implícita | Rutas indexables y no indexables, canónica sin barra final | Las de `docs/seo.md` → Reglas del sitio | `docs/seo.md` |
| 2026-11-12 | implícita | Título y descripción únicos y canónica absoluta por ruta indexable; `noindex` fuera de lo público | Principios P18 y P19 | `docs/constitution.md` P18, P19 |
| 2026-11-12 | brecha | No hay logo vectorial para un ícono SVG | Íconos PNG de 32, 180, 192 y 512 px desde el favicon actual; el SVG queda pendiente hasta tener logo vectorial | usuario |
| 2026-11-12 | brecha | ¿Dirección en un solo texto o separada? | Separada en la fuente de datos del sitio (calle, ciudad, estado, CP, país) con los valores provisionales | usuario (/analyze A6) |
| 2026-11-12 | cierre | Relación con 017 | Resuelve 017 CA6 (título y descripción propios por ruta) y modifica 017 CA5: la página "no encontrada" se sirve con código 404 | /analyze A13 |
| 2026-11-12 | supuesto | Imagen para compartir | Una sola imagen general de 1200×630 con el logo y una foto existente del sitio, sin diseño nuevo | /specify |

## Notas para /plan
- Hoy `frontend/nginx.conf` sirve `index.html` para toda ruta (`try_files … /index.html`): por eso
  `/robots.txt` y las URL inexistentes responden 200 con HTML. El prerender y el 404 real cambian
  esta configuración.
- El `index.html` de respaldo que reciben las rutas privadas puede llevar `noindex`, ya que las
  públicas tendrán su propio HTML.
- Las secciones de la portada piden datos a la API en el navegador; el prerender no tiene acceso a
  la API de producción en el build.
- Datos de la clínica en `frontend/src/data/site.js` (`CLINIC`, `HOURS`).
- Herramienta de prerender: dependencia nueva → ADR (P3).

## Historial
| Fecha | Cambio | Motivo |
|---|---|---|
| 2026-11-12 | Spec creada en borrador | /specify, objetivo 4 del roadmap (re-auditoría `/seo audit`) |
| 2026-11-12 | Aprobada | usuario |
| 2026-11-12 | CA12: íconos en PNG (sin logo vectorial) | /specify --edit, decisión del usuario antes de /plan |
| 2026-11-12 | CA7 (dirección separada, imagen, horario no interpretable), SE7 separada y relación con 017; vuelve a draft | /analyze A6, A7, A13 |
| 2026-11-12 | Aprobada de nuevo | usuario |
| 2026-11-12 | Implementada: CA1–CA13 con sus pruebas en verde | /implement |
