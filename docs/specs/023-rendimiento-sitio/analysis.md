---
result: fail
round: 1
mode: full
constitution_version: 1.0.0
date: 2026-11-17
spec_sha: 788c7c328686
plan_sha: eef7d215ba07
tasks_sha: d315d7b79b3f
---

# Análisis · 023 Rendimiento del sitio público y el login

## Resumen
**Falla.** Hay un hallazgo crítico: el botón nuevo "Ver mapa" no cumple el contraste de P16, y la
constitución solo exime el código previo mientras no se toca. Hay además varios altos que harían
inviables tareas tal como están escritas:
- la guarda del build rompe el build durante varias tareas;
- la regla de módulos privados es imposible tal como se redactó;
- hay archivos que faltan en T021 y T024;
- la "foto de contacto" no existe.

Las correcciones son localizadas: `/specify --edit`, `/design-spec --fix`, `/plan --fix` y `/tasks
--fix`. Hay tres decisiones del usuario.
Conteo: CRÍTICA 1 · ALTA 10 · MEDIA 11 · BAJA 5

## Cobertura
| Métrica | Valor |
|---|---|
| Criterios con tarea de test e implementación | 10 / 10 (CA1 y CA2 con medición manual) |
| Amenazas con control y test | 0 / 0 (el plan no declara amenazas; ver A9) |
| Principios de la constitución evaluados | 20 / 20 |

## Seguimiento de rondas anteriores
Primera ronda.

## Hallazgos nuevos
| ID | Categoría | Severidad | Ubicación | Hallazgo | Corrección |
|---|---|---|---|---|---|
| A1 | Constitución | CRÍTICA | `design.md` (Accesibilidad, Decisiones); plan P16 | "Ver mapa" es un control nuevo con `.dt-btn--primary` (3,96:1 < 4,5:1). La exención de código previo (`constitution.md` "Código previo") no cubre un uso nuevo. La fila `implícita` resuelve un conflicto con la constitución sin el usuario | El texto de "Ver mapa" cumple 4,5:1 sobre su fondo o hay una excepción aprobada por el usuario. Se comprueba con un test de contraste de los colores del bloque (A10). Decisión del usuario; luego `/design-spec 023 --fix` |
| A2 | Inconsistencia | ALTA | T023 | T023 exige que la guarda de hosts pase, pero Unsplash y Maps siguen hasta T024 y T025 | La guarda de hosts se exige solo en una tarea que depende de T023, T024 y T025 (`/tasks --fix`) |
| A3 | Inconsistencia | ALTA | T016, T015, T002; plan Riesgos | Desde T016 el build falla hasta T025: no hay commit con el build en verde y no se puede medir entre bloques | Cada commit deja `npm run build` en verde. La lógica de la guarda se prueba con Vitest sobre manifiestos de ejemplo, y cada regla se activa en el build en la tarea que la hace pasar. T015 va antes que cualquier regla nueva (`/plan --fix`, `/tasks --fix`) |
| A4 | Viabilidad | ALTA | T016; plan fila `prerender.mjs` | "`src/pages/admin/*` y `paciente/*` son entradas dinámicas" siempre falla: las subpáginas del panel se importan estáticamente desde `AdminPanel`. Un módulo incrustado en el chunk de entrada no tiene clave en el manifiesto | La regla nombra los siete módulos de T020: cada uno es `isDynamicEntry` y su chunk no está en el cierre de `imports` de `index.html` (test sobre un manifiesto de ejemplo) |
| A5 | Archivos | ALTA | T021; `frontend/tests/login-redireccion.test.jsx:7` | El mock de `@react-oauth/google` solo exporta `GoogleLogin`. Con el proveedor dentro de `login.jsx`, ese test falla | T021 incluye ese test, con el proveedor simulado que solo pinta a sus hijos |
| A6 | Archivos | ALTA | T022, T024 | `SmartImage` no acepta `srcSet`. T024 lo necesita y no lista `SmartImage.jsx` ni depende de T022 | T022 añade `srcSet` a `SmartImage` y T024 depende de T022 |
| A7 | Spec ↔ código | ALTA | spec Problema y CA7; plan; T024, T025 | `IMAGES.contact` no se usa: `/contacto` no pinta ninguna foto. La "foto de contacto" no existe | En la spec, CA7 se refiere a la foto de nosotros y a que no queden URLs externas en `site.js`. Se quitan las variantes `contacto-*` y la foto de T025 (`/specify --edit`, `/plan --fix`, `/tasks --fix`) |
| A8 | Medición | ALTA | spec supuesto "Cómo se mide"; plan; T002, T021, T060 | La imagen local no lleva el client ID de Google (Dockerfile sin `ARG`). `/login` se mediría sin el script `gsi/client` que tiene en producción, y la verificación de T021 no se puede hacer | Decisión del usuario sobre cómo llega el client ID al build local. La meta de `/login` se mide con el script de Google cargado (riesgo añadido al plan) |
| A9 | Seguridad / P12 | ALTA | plan Modelo de amenazas; tasks P12 | El plan dice que la guarda comprueba `login.html` con los textos privados de la 022, pero esos textos son del propio login y ninguna tarea lo implementa. Plan (✅) y tareas (➖) no coinciden en P12 | `login.html` no contiene token, JWT ni datos de usuario. Test sobre el HTML generado (T013 o T026), amenaza TM1 en el plan y P12 alineado |
| A10 | P16 | ALTA | plan P16; T011, T025 | El contraste y el foco visible del bloque nuevo solo se comprueban a mano | Test que calcula el contraste de los pares de color del bloque (texto, nota y botón) y comprueba que hay un estilo de foco visible |
| A11 | P20 | ALTA | plan P20; tasks P20 | La prohibición de literales en estilos nuevos (`Contact.css`) solo se comprueba a mano | Test que falla si el CSS nuevo del bloque del mapa usa colores literales en lugar de variables |
| A12 | Extends | MEDIA | spec `extends` | La 023 cambia comportamiento de la 022 (`/login` deja `app.html`), no declarado | `extends: [017, 022]` y su nota |
| A13 | Docs | MEDIA | plan Impacto; T090 | Ninguna tarea actualiza `docs/seo.md` (renderizado, fila `/login`) ni la línea de `architecture.md` sobre Google Fonts y Unsplash | Añadirlo a T090 |
| A14 | Test | MEDIA | T013, T026 | El caso de login prueba `construirPagina` con parámetros del test, no lo que genera el prerender | Una función compartida para la página de login, usada por el test y por `prerender.mjs` |
| A15 | Test | MEDIA | T012 | Montar `AppRoutes` sin el árbol raíz no puede fallar hoy (el proveedor está en `main.jsx`) | El test monta el mismo árbol raíz que `main.jsx` (exportado), o se apoya solo en la comprobación del código y en la manual |
| A16 | Viabilidad | MEDIA | plan `App.jsx`; T020 | No hay `Suspense` alrededor de `/login`, `/admin` ni `/paciente` | El plan fija el `Suspense` y su respaldo para las rutas privadas; T014 lo cubre con la hidratación del login |
| A17 | Inconsistencia | MEDIA | plan, T016, T013, T026 | El alcance de la guarda de hosts es de siete páginas en el plan y de seis en T016; `login.html` no entra | Siete páginas, `login.html` incluido |
| A18 | Inconsistencia | MEDIA | plan `prerender.mjs, cabecera.js`; T026 `rutas.js` | Plan y tareas no coinciden en los archivos | Alinear el plan con T026 |
| A19 | Tarea sin plan | MEDIA | T003 | `capturas.mjs` no está en el plan, y `--screenshot` no captura la página completa | Al plan, con el mecanismo (Chrome DevTools Protocol desde Node 22) |
| A20 | CA10 | MEDIA | T015 | XML y texto sin comprobar | `sitemap.xml` en T015; `robots.txt` exento por tamaño (`gzip_min_length`), explícito |
| A21 | Medición | MEDIA | spec y `design.md` K2 | Lighthouse no pulsa "Ver mapa": el CLS no mide el salto al cargar el mapa | Test: el `.map` mantiene sus clases de tamaño antes y después; verificación manual con captura |
| A22 | Supuestos | MEDIA | spec Decisiones | Que una página quede en 98–99 se decide en `/review`; con el backend ficticio, las secciones de la API se miden vacías | Decisión del usuario (confirmar o cambiar) |
| A23 | Terminología | BAJA | spec CA6, Diseño; `design.md`; plan | "Abrir en Google Maps" frente a "Cómo llegar"; "botón" frente a enlace | Unificar en "Cómo llegar"; "Ver mapa" es un enlace (Enter) |
| A24 | Ambigüedad | BAJA | T014 | "Hoy pasa o falla" | Se espera el fallo: `GoogleLogin` sin proveedor |
| A25 | Conflicto | BAJA | plan Riesgos | La rama de la maqueta también cambia `package.json` y el lockfile (`qrcode.react`) | Añadirlos al riesgo |
| A26 | Cobertura | BAJA | CA8; T010 | `font-display` sin prueba | T010 comprueba `font-display: swap` en la fuente |
| A27 | Cobertura | BAJA | CA4; T060 | Solo se comprueba "al recargar" | Añadir la navegación del login al panel |

## Decisiones pendientes del usuario
- **A1:** "Ver mapa" con un fondo que cumpla 4,5:1 (`--primary-700`, 5,48:1) o una excepción con
  vencimiento.
- **A8:** cómo llega el client ID de Google al build local: hacer antes el `/fix` del Dockerfile
  (`ARG VITE_GOOGLE_CLIENT_ID`) o pasarlo solo en los scripts de medición.
- **A22:** confirmar los supuestos de medición (backend ficticio y decisión en `/review` por ruido)
  o cambiarlos.

Respuestas del usuario (2026-11-17):
- **A1:** "Ver mapa" con fondo `--primary-700` (5,48:1), solo en este botón → `/design-spec 023 --fix`.
- **A8:** primero un `/fix` del Dockerfile (`ARG VITE_GOOGLE_CLIENT_ID` con test); los scripts de
  medición pasan el ID desde `frontend/.env` sin mostrarlo.
- **A22:** confirmados los supuestos de medición (backend ficticio; ruido de 98–99 decidido en `/review`).

Correcciones: `/specify --edit 023` (A7, A12, A22, A23), `/design-spec 023 --fix` (A1, A21, A23),
`/plan 023 --fix` (A1–A4, A7–A11, A13–A21, A25) y `/tasks 023 --fix` (todos los que tocan tareas).
Después, `/analyze 023` en modo delta.

## Aceptados
Ninguno: se corrigen todos.
