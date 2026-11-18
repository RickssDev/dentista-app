---
lane: chore
status: released
released: v1.4.1 (2026-11-18)
base: d2efd91
relates: [017, 022]
covers: []
escalated_to: null
---

# Chore: ubicación real de la clínica y título de la portada

## Problema
El sitio situaba la clínica en Ciudad de México con una dirección de ejemplo ("Av. Universidad
1200", CP 03100). La clínica está en Lázaro Cárdenas, Michoacán (usuario, 2026-11-18). Además, el
usuario quiere que la portada se presente en buscadores y al compartir como "Dentissa | Odontología
Integral", con una descripción acorde.

## Cambio
- `frontend/src/data/site.js`: ciudad "Lázaro Cárdenas" y estado "Michoacán"; calle y código postal
  vacíos (no hay datos reales). `address` y `mapQuery` se arman solo con las partes que existen:
  "Lázaro Cárdenas, Michoacán" en contacto, pie de página, aviso de privacidad y mapa.
- `frontend/src/seo/negocioLocal.js`: el `PostalAddress` omite los campos vacíos, para no publicar
  una calle inventada.
- `frontend/src/seo/rutas.js` y `frontend/index.html`: título de `/` "Dentissa | Odontología
  Integral"; descripción de `/` y general "Odontología integral en Lázaro Cárdenas: odontología
  general, ortodoncia y estética dental en un solo lugar, con tecnología avanzada y trato cálido."
  (148 caracteres); descripción de `/contacto` con la ciudad nueva.
- Tests: `seo-metadatos` con la descripción nueva; `seo-negocio-local` con la dirección real y un
  caso nuevo para cuando haya calle y código postal.
- Docs: `docs/seo.md` (pendientes operativos) y `docs/roadmap.md`.
- Sin cambios: teléfono, WhatsApp y horario (decisión del usuario); `TITULO_GENERAL` de las páginas
  privadas ("Dentissa | Clínica Dental").

## Escalado
`aidd.py lane-check` (ver Verificación). Es contenido: no cambia contratos, datos guardados,
permisos ni dependencias.

## Verificación
- `npx vitest run`: 22 archivos, 190 tests en verde. Lint limpio en los archivos tocados.
- `npm run build`: prerender completo con todas las guardas (la descripción cumple 70–160).
  `dist/index.html`: `<title>Dentissa | Odontología Integral</title>`, `og:title` igual,
  descripción nueva, JSON-LD con `addressLocality` "Lázaro Cárdenas" y `addressRegion` "Michoacán"
  sin `streetAddress` ni `postalCode`. `dist/contacto/index.html` y el aviso de privacidad muestran
  "Lázaro Cárdenas, Michoacán".
- En producción, tras desplegar: Google tarda días en volver a leer la portada (se puede pedir
  "Solicitar indexación" en Search Console); WhatsApp guarda la vista previa de cada enlace.

- Producción (usuario, 2026-11-18): la portada muestra "Dentissa | Odontología Integral" y la ubicación nueva; al compartir el enlace sale la vista previa con imagen. Google aún muestra el resultado anterior hasta volver a leer la portada (indexación solicitada).

## Decisiones
| Fecha | Tipo | Pregunta / conflicto | Decisión | Fuente |
|---|---|---|---|---|
| 2026-11-18 | brecha | Título y descripción de la portada | "Dentissa \| Odontología Integral" y la opción A, con Lázaro Cárdenas en lugar de Ciudad de México | usuario |
| 2026-11-18 | brecha | Ubicación de la clínica | Lázaro Cárdenas, Michoacán, en todo el sitio; teléfono y horario sin cambios por ahora | usuario |
| 2026-11-18 | supuesto | ¿Qué hacer con la calle y el CP de ejemplo? | Quitarlos: una calle de Ciudad de México en otra ciudad sería una dirección inventada | Claude, avisado al usuario |
| 2026-11-18 | implícita | Grafía | "Lázaro Cárdenas" y "Michoacán", con acentos | ortografía |
