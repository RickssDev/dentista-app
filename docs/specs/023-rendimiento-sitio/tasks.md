---
spec: 023-rendimiento-sitio
plan: plan.md
status: approved
---

# Tareas · 023 Rendimiento del sitio público y el login

Formato:
`- [ ] T### [P] <verbo + qué> — <archivos> — hecho cuando: <criterio> — cubre: CA# — depende: T###`
- T001–T089: trabajo. T090–T099: reservadas.
- `[P]` = paralelizable con las demás `[P]` de su grupo una vez cumplidas sus dependencias (no
  comparte archivos con otra tarea abierta).
- Lo generado por un comando cuenta como un archivo: `public/images/*.webp (generado por <comando>)`.
- `[-]` = obsoleta (`— obsoleta: <motivo> (AAAA-MM-DD)`): no cuenta como abierta ni como hecha.
- Bajo una tarea: `  - nota: …`, `  - bloqueo: AAAA-MM-DD — <qué falta> — <skill a ejecutar>`.
- La comprobación a mano va en la tarea que construye la pieza.

## Constitution Check
Revisión del desglose contra `plan.md` (constitución 1.0.0).

| Principio | Resultado | Justificación / ajuste | Cómo se verifica |
|---|---|---|---|
| P1 Spec antes de implementar | ✅ | Spec, `design.md` y plan `approved` | manual: `aidd.py validate` |
| P2 Tests por feature | ✅ | Cada tarea de implementación depende de su tarea de test o de la guarda, escritas antes | test: T010–T016 |
| P3 Dependencias nuevas con ADR | ✅ | T001 instala la única dependencia, con ADR 0010 aceptado | manual: ADR 0010 |
| P4 Arquitectura con ADR | ✅ | ADR 0010; T090 actualiza la arquitectura | manual: T090 |
| P5 Producción solo con aprobación humana | ✅ | T096 se mantiene | manual: T096 |
| P6 Rollback documentado | ✅ | Rollout del plan; sin datos | manual: T096 |
| P7 Migraciones compatibles | ➖ | Sin esquema | — |
| P8 Autorización en el servidor | ➖ | Sin endpoints | — |
| P9 Entrada validada | ➖ | Sin entradas nuevas | — |
| P10 Secretos | ✅ | Solo `VITE_*` públicas en el build | test: gitleaks en CI |
| P11 Vulnerabilidades | ✅ | T001 comprueba `npm audit` tras instalar | test: `npm audit` en T001 y T060 |
| P12 Modelo de amenazas | ➖ | Sin entradas ni datos nuevos (plan) | — |
| P13–P15 | ➖ | Sin datos sensibles ni logs | — |
| P16 Accesibilidad | ✅ | Teclado y foco del mapa probados; Lighthouse Accesibilidad no baja | test: T011; manual: T025, T060 |
| P17 Sin lógica en las vistas | ✅ | Imágenes en `site.js`, títulos en `seo/rutas.js` | manual: `/review` |
| P18 Metadatos por ruta indexable | ✅ | Sin cambios en las públicas; los tests de 022 siguen | test: suite en T060 |
| P19 Noindex fuera de lo público | ✅ | `login.html` con `noindex`, sin canónica, fuera del sitemap; `X-Robots-Tag` en `/login` | test: T013, T015, T016 |
| P20 Sistema de diseño | ✅ | El bloque del mapa usa `.map`, `.dt-btn` y tokens | manual: T025 contra `design.md`, `/review` |

## Preparación
- [ ] T001 Instalar `@fontsource-variable/plus-jakarta-sans@5.3.0` — `frontend/package.json`, `frontend/package-lock.json` — hecho cuando: `npm ci --prefix frontend` instala sin scripts de instalación y `npm audit --audit-level=high --prefix frontend` sigue sin altas ni críticas
- [ ] T002 Crear el script de medición y medir la línea base — `frontend/scripts/medir-rendimiento.mjs` — hecho cuando: el script construye la imagen de `probar-nginx` (o usa la existente), la levanta con `--add-host backend:127.0.0.1`, pasa Lighthouse 13.6.0 móvil 3 veces por cada una de las siete rutas y escribe la mediana de Rendimiento, LCP, CLS, SEO y Accesibilidad; la tabla de `main` queda anotada como nota de esta tarea
- [ ] T003 Crear el script de capturas y capturar el estado actual — `frontend/scripts/capturas.mjs` — hecho cuando: con Chrome sin cabeza guarda capturas de página completa a 390 y 1440 px de las siete rutas en `.ai/inspect/023-<etiqueta>/`, y quedan las de `antes` (14 archivos)

## Tests (antes de implementar)
- [ ] T010 [P] Escribir las pruebas de recursos locales — `frontend/tests/rendimiento-recursos.test.js` — hecho cuando: falla por la razón esperada y comprueba: `index.html` sin `fonts.googleapis.com`, `fonts.gstatic.com`, `images.unsplash.com` ni `<link rel="icon" type="image/jpeg">`; `IMAGES` de `site.js` sin URL externas; existen `public/images/nosotros-{600,900,1200}.webp` y `contacto-{600,900,1200}.webp` con ese ancho (cabecera WebP); `global.css` declara "Plus Jakarta Sans Variable" en `--font-sans`; `main.jsx` importa `@fontsource-variable/plus-jakarta-sans` — cubre: CA7, CA8
- [ ] T011 [P] Escribir las pruebas del bloque del mapa — `frontend/tests/rendimiento-mapa.test.jsx` — hecho cuando: falla por la razón esperada y comprueba en `Contact`: sin `iframe` al montar; enlace "Ver mapa" con `href` = `mapLink`; al pulsarlo (clic y Enter con el foco en él) aparece el `iframe` "Ubicación de Dentissa en Google Maps", no se navega (evento cancelado) y el foco queda en el `iframe`; "Cómo llegar" presente antes y después; ejecutada dos veces — cubre: CA6
- [ ] T012 [P] Escribir las pruebas de carga sin Google — `frontend/tests/rendimiento-carga.test.jsx` — hecho cuando: falla por la razón esperada y comprueba: al montar `AppRoutes` en `/`, `/nosotros` y `/contacto` (MemoryRouter) no se inserta ningún `<script>` con `accounts.google.com`; `src/main.jsx` no usa `GoogleOAuthProvider`; `src/pages/admin/login.jsx` sí lo usa; ejecutada dos veces — cubre: CA5
- [ ] T013 Ampliar las pruebas del HTML generado — `frontend/tests/seo-prerender.test.jsx` — hecho cuando: falla por la razón esperada y comprueba: ninguna de las seis páginas ni `login.html` contiene los hosts prohibidos del plan; en la portada, el contenedor de la foto principal lleva `is-priority` y no `is-loading`; en nosotros, la foto principal es `loading="eager"` con `srcset` de `/images/nosotros-*.webp`; en contacto no hay `<iframe` y sí el enlace "Ver mapa"; `construirPagina` del login (`noindex`, título `TITULO_LOGIN`) lleva `noindex`, el título y el formulario de acceso, y no lleva canónica, Open Graph ni JSON-LD — cubre: CA2, CA3, CA6, CA7, CA8
- [ ] T014 Añadir el login a la prueba de hidratación — `frontend/tests/seo-hidratacion.test.jsx`, `frontend/tests/support/prerenderizar.mjs` — hecho cuando: `/login` se prerenderiza en el ayudante y se hidrata (con el árbol del login) sin errores recuperables ni de hidratación; ejecutada dos veces; hoy pasa o falla por la razón esperada y queda anotado — cubre: CA5, CA9
- [ ] T015 [P] Ampliar la prueba de nginx — `frontend/scripts/probar-nginx.mjs` — hecho cuando: comprueba `/login` → 200 con `X-Robots-Tag: noindex` y el formulario ya en el HTML; `/`, un `/assets/*.js` y un `/assets/*.css` con `Accept-Encoding: gzip` → `Content-Encoding: gzip`; un `/assets/*` → `Cache-Control` con `max-age=31536000` e `immutable`; contra la imagen actual fallan solo los casos nuevos — cubre: CA10
- [ ] T016 Ampliar la guarda del build — `frontend/scripts/prerender.mjs` — hecho cuando: el build falla si alguna de las seis páginas referencia un host prohibido o si `src/pages/admin/*` o `src/pages/paciente/*` no son entradas dinámicas del manifiesto o están en las importaciones estáticas de `index.html`; hoy falla por las razones esperadas (Google Fonts en la plantilla y `AdminPanel` estático) — cubre: CA4, CA7, CA8 — depende: T013

## Implementación
- [ ] T020 Cargar bajo demanda el login, el panel, el portal y restablecer contraseña — `frontend/src/App.jsx` — hecho cuando: la parte de módulos privados de la guarda (T016) pasa; los tests del panel, el portal y el login siguen en verde — cubre: CA4 — depende: T016
- [ ] T021 Montar el inicio de sesión con Google solo en el login — `frontend/src/main.jsx`, `frontend/src/pages/admin/login.jsx` — hecho cuando: T012 pasa (dos ejecuciones); los tests del login siguen en verde · verificación manual: entrar con Google en el contenedor local (usuario) — cubre: CA5 — depende: T012, T020
- [ ] T022 Pintar la foto principal sin esperar a JavaScript — `frontend/src/components/home/SmartImage.jsx`, `frontend/src/styles/home/global.css` — hecho cuando: el caso de la portada de T013 pasa; T014 y la prueba de hidratación de 022 siguen en verde · verificación manual: la portada sin JavaScript muestra la foto — cubre: CA3 — depende: T013
- [ ] T023 Servir Plus Jakarta Sans desde el sitio y quitar los recursos externos de la plantilla — `frontend/index.html`, `frontend/src/main.jsx`, `frontend/src/styles/home/global.css` — hecho cuando: la parte de fuentes e `index.html` de T010 pasa; la guarda de hosts pasa en el build — cubre: CA8 — depende: T001, T010, T016, T021, T022
- [ ] T024 Alojar las fotos de nosotros y contacto en WebP — `frontend/public/images/*.webp (generado por descarga de Unsplash con fm=webp&w=N&q=70)`, `frontend/src/data/site.js`, `frontend/src/pages/About.jsx` — hecho cuando: la parte de fotos de T010 y el caso de nosotros de T013 pasan — cubre: CA2, CA7 — depende: T010, T013
- [ ] T025 Construir el bloque del mapa bajo demanda y la foto local de contacto — `frontend/src/pages/Contact.jsx`, `frontend/src/styles/home/Contact.css` — hecho cuando: T011 (dos ejecuciones) y el caso de contacto de T013 pasan · verificación manual: bloque del mapa a 390 y 1440 px contra `design.md` (K1, K2), "Ver mapa" con ratón y con teclado (usuario) — cubre: CA6, CA7 — depende: T011, T013, T024
- [ ] T026 Prerenderizar el login con `noindex` — `frontend/scripts/prerender.mjs`, `frontend/src/seo/rutas.js` — hecho cuando: el build genera `dist/login.html` con `TITULO_LOGIN` ("Iniciar sesión | Dentissa"), `noindex` y el CSS de su chunk; la guarda falla si `login.html` lleva canónica (comprobado rompiendo); los casos de login de T013 y T014 pasan; `sitemap.xml` sigue sin `/login` — cubre: CA2, CA5, CA9 — depende: T013, T014, T016, T021
- [ ] T027 Servir `/login` prerenderizado, comprimir y cachear los assets en nginx — `frontend/nginx.conf` — hecho cuando: `node frontend/scripts/probar-nginx.mjs` pasa completo (T015) · comprobado rompiendo `gzip` — cubre: CA10 — depende: T015, T026
  - nota: `frontend/nginx.conf` es ruta protegida; se modifica con esta tarea aprobada

## Integración y documentación
- [ ] T060 Verificar el sitio completo — sin archivos — hecho cuando: `npm test` en verde; lint sin errores nuevos en los archivos tocados; `npm run build` correcto; `npm audit --audit-level=high` sin altas ni críticas · verificación manual: `medir-rendimiento.mjs` con mediana de 3 por ruta cumple CA1 (100 en nosotros, galería, aviso, términos y login; ≥ 95 en portada y contacto) y CA2 (LCP ≤ 2,5 s, CLS ≤ 0,1), SEO 100 y Accesibilidad no menor que la línea base (T002); capturas `despues` (T003) iguales a las de `antes` salvo el mapa, revisadas por el usuario (CA9); login, panel y portal funcionan al recargar — cubre: CA1, CA2, CA9 — depende: T020, T021, T022, T023, T024, T025, T026, T027
- [ ] T090 Actualizar `docs/architecture.md` (login prerenderizado, división de código de las rutas privadas, compresión y caché en nginx)
- [ ] T091 Actualizar `docs/deployment.md` y `docs/observability.md` si cambiaron variables, entornos, pasos de deploy, logs, eventos de auditoría o métricas
  - nota: el plan no cambia ninguno; registrar "sin cambios" al cerrar
- [ ] T092 Marcar spec como `implemented`

## Despliegue (lo ejecuta `/release`)
- [ ] T095 Desplegar a staging y verificar criterios de aceptación
  - nota: no hay staging (`docs/deployment.md`); las verificaciones se hacen con el contenedor local (T060)
- [ ] T096 Aprobación humana para producción
- [ ] T097 Desplegar a producción y vigilar métricas del plan (Rollout)
  - Lighthouse en producción en las siete rutas (usuario); login con Google; panel y portal al recargar
- [ ] T098 Marcar spec como `released`

## Cobertura
| Criterio | Tarea(s) de test | Tarea(s) de implementación |
|---|---|---|
| CA1 | T002, T060 | T020, T021, T022, T023, T024, T025, T026, T027 |
| CA2 | T002, T013, T060 | T022, T024, T025, T026 |
| CA3 | T013 | T022 |
| CA4 | T016 | T020 |
| CA5 | T012, T014 | T021, T026 |
| CA6 | T011, T013 | T025 |
| CA7 | T010, T013, T016 | T024, T025 |
| CA8 | T010, T013, T016 | T023 |
| CA9 | T003, T014, T060 | T026 |
| CA10 | T015 | T027 |

| Cambio del plan (módulo) | Tarea(s) |
|---|---|
| `frontend/package.json`, `package-lock.json` | T001 |
| `frontend/scripts/medir-rendimiento.mjs` | T002 |
| `frontend/scripts/capturas.mjs` | T003 |
| `frontend/src/App.jsx` | T020 |
| `frontend/src/main.jsx`, `pages/admin/login.jsx` | T021, T023 |
| `frontend/src/components/home/SmartImage.jsx`, `styles/home/global.css` | T022, T023 |
| `frontend/index.html` | T023 |
| `frontend/public/images/`, `src/data/site.js`, `pages/About.jsx` | T024 |
| `frontend/src/pages/Contact.jsx`, `styles/home/Contact.css` | T025 |
| `frontend/scripts/prerender.mjs`, `src/seo/rutas.js` | T016, T026 |
| `frontend/nginx.conf` | T027 |
| `frontend/scripts/probar-nginx.mjs` | T015 |
| `frontend/tests/` | T010, T011, T012, T013, T014 |
| `docs/architecture.md` | T090 |

| Requisito no funcional | Tarea(s) de test o verificación manual (T095) |
|---|---|
| Rendimiento (CA1, CA2) | T002 (línea base), T060 |
| Rendimiento en producción | T097 (usuario) |
| Descubribilidad sin cambios | T013, T060 (SEO 100) |
| Accesibilidad del botón del mapa | T011, T025 |
