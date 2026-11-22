---
spec: 024-cabeceras-seguridad
plan: plan.md
impl_base: a608beb
status: approved
---

# Tareas · 024 Protecciones del navegador en todo el sitio

Formato:
`- [ ] T### [P] <verbo + qué> — <archivos> — hecho cuando: <criterio> — cubre: CA# — depende: T###`
- T001–T089: trabajo. T090–T099: reservadas.
- `[P]` = paralelizable con las demás `[P]` de su grupo una vez cumplidas sus dependencias (no
  comparte archivos con otra tarea abierta).
- Lo generado por un comando cuenta como un archivo: `.ai/inspect/024-antes/ (generado por <comando>)`.
- `[-]` = obsoleta (`— obsoleta: <motivo> (AAAA-MM-DD)`): no cuenta como abierta ni como hecha.
- Bajo una tarea: `  - nota: …`, `  - bloqueo: AAAA-MM-DD — <qué falta> — <skill a ejecutar>`.
- La comprobación a mano va en la tarea que construye la pieza.
- `probar-nginx.mjs` (CI) queda en rojo desde T011 hasta T021: el PR se abre al final.
- `nginx.conf` y `Dockerfile` son rutas protegidas: solo los tocan T021.
- Corregidas por `/analyze` ronda 1: T010, T011, T023 y las tablas de Cobertura; nuevas T013 y T025.

## Constitution Check
Revisión del desglose contra `plan.md` (constitución 1.0.0, en `draft`).

| Principio | Resultado | Justificación / ajuste | Cómo se verifica |
|---|---|---|---|
| P1 Spec antes de implementar | ✅ | Spec y plan aprobados antes de T001 | manual: `aidd.py validate` |
| P2 Tests por feature | ✅ | T020, T021 y T025 dependen de T010, T011 y T013, escritas antes; T012 antes de la verificación en navegador. Recorrido de los paneles manual (T023, decisión del usuario, `/analyze` A6) | test: T010, T011, T012, T013 |
| P3 Dependencias con ADR | ➖ | Ninguna tarea instala dependencias | — |
| P4 Arquitectura con ADR | ✅ | Sin cambio de arquitectura; T090 documenta la regla de la CSP | manual: T090 |
| P5 Producción con aprobación humana | ✅ | T096 | manual: T096 |
| P6 Rollback documentado | ✅ | Rollout del plan; T091 añade la verificación post-deploy | manual: T096 |
| P7–P9 | ➖ | Sin esquema, endpoints ni entradas | — |
| P10 Secretos | ✅ | Las tareas no tocan secretos; `probar-csp.mjs` lee el client ID de `frontend/.env` sin mostrarlo | test: gitleaks en CI |
| P11 Vulnerabilidades | ✅ | Sin dependencias; `npm audit` en T024 | test: `npm audit` en T024 |
| P12 Modelo de amenazas | ✅ | Cada `TM#` con tarea de test y de control (Cobertura) | test: T010, T011, T012 |
| P13–P15 | ➖ | Sin datos sensibles ni logs | — |
| P16 Accesibilidad | ✅ | Sin cambios visibles: capturas antes y después | manual: T001, T022 |
| P17 Sin lógica en las vistas | ➖ | Sin vistas | — |
| P18 Metadatos | ✅ | Suite de la 022 en verde | test: suite en T024 |
| P19 Noindex | ✅ | `X-Robots-Tag` conservado | test: T011 |
| P20 Sistema de diseño | ➖ | Sin estilos | — |

## Preparación
- [x] T014 Ajustar los scripts de medición y capturas a esta spec — `frontend/scripts/medir-rendimiento.mjs`, `frontend/scripts/capturas.mjs` — hecho cuando: `medir-rendimiento.mjs` mide también Prácticas recomendadas, descarta (y repite) las corridas con `environment.benchmarkIndex` < 2000 y lo anota por corrida, y acepta `--salida <carpeta>` bajo `.ai/inspect/`; `capturas.mjs` acepta `--salida` y en `/contacto` pulsa "Ver mapa" y espera el `iframe` antes de capturar; sin `--salida` ambos escriben donde antes; una corrida corta (`--rutas /login --corridas 1`) muestra las cuatro categorías y el índice
  - nota: añadida durante /implement: los scripts de la 023 no miden Prácticas recomendadas ni filtran por `benchmarkIndex`, escriben siempre en `023-*` y no cargan el mapa, y T001/T024 lo exigen (decisión del usuario 2026-11-19)
  - nota: corrida corta `/login`: Rendimiento 99, Prácticas 96, SEO 66, Accesibilidad 93, índice 2827 (descartada una de 1240); `/contacto` capturado con el mapa a 390 y 1440 px. El viewport se agranda al alto de la página en `/contacto` porque Chrome no pinta el `iframe` de otro origen al capturar fuera del viewport. Si falla `docker build`, el error ya no muestra el client ID. En Git Bash las rutas `/x` se convierten en rutas de Windows: correr desde PowerShell
- [x] T001 Medir la línea base y capturar el estado actual — `.ai/inspect/024-antes/ (generado por scripts/medir-rendimiento.mjs y scripts/capturas.mjs)` — hecho cuando: hay mediana de 5 de Rendimiento, Prácticas recomendadas y SEO en las siete rutas sobre `main` (v1.4.1), con `benchmarkIndex` ≥ 2000 en cada corrida, y capturas de portada, contacto (con el mapa cargado) y login a 390 y 1440 px; tabla anotada como nota de esta tarea — depende: T014
  - nota: medido sobre `origin/main` d91d6a3 (v1.4.1; el `main` local seguía en v1.4.0) con `--sin-build` y la imagen construida desde una copia temporal; mediana de 5, Lighthouse 13.6.0 móvil, `benchmarkIndex` ≥ 2000 en todas (descartadas 1533 y 1636 en `/`). Capturas de portada, contacto con el mapa y login a 390 y 1440 px
  - nota: Rendimiento / Prácticas / SEO / Accesibilidad — `/` 97/96/100/96 · `/nosotros` 98/100/100/96 · `/galeria` 100/96/100/98 · `/contacto` 100/100/100/94 · `/aviso-de-privacidad` 100/100/100/100 · `/terminos-de-servicio` 100/100/100/100 · `/login` 99/96/66/93
  - nota: SEO 66 en `/login` es por su `noindex` (spec 022): en T024 "SEO 100" se aplica a las seis rutas indexables y `/login` debe quedar igual (66)

## Tests (antes de implementar)
- [x] T010 [P] Escribir la prueba de la configuración de cabeceras — `frontend/tests/seguridad-cabeceras.test.js` — hecho cuando: falla por la razón esperada (no existe `nginx-seguridad.conf`, las `location` no lo incluyen, el `Dockerfile` no lo copia) y comprueba: cada cabecera de la tabla de Contratos del plan con su valor exacto y `always`; la CSP por directivas (`script-src` sin `'unsafe-inline'`, `'unsafe-eval'`, `*`, `data:` ni `http:`; `frame-ancestors 'none'`; `object-src 'none'`; `base-uri 'self'`; `form-action 'self'`; los orígenes externos de todas las directivas son exactamente los del plan); HSTS exactamente `max-age=31536000`, sin `includeSubDomains` ni `preload`; `img-src` incluye `blob:` (vistas previas, `/analyze` A1); cada `location` de `nginx.conf` salvo `^~ /api/` y `^~ /uploads/` incluye `/etc/nginx/snippets/seguridad.conf`; el `Dockerfile` copia `nginx-seguridad.conf` a esa ruta — cubre: CA1, CA2, CA3, CA4, CA9
  - nota: falla por la razón esperada en dos ejecuciones: 25 de 27 casos (no existe `nginx-seguridad.conf`; las `location` no lo incluyen; el `Dockerfile` no lo copia). Los 2 que pasan son de preparación (`nginx.conf` tiene sus `location`; HSTS sin `includeSubDomains` sobre un valor vacío) y se comprueban rompiendo en T020/T021. `script-src` también prohíbe `blob:`, más estricto que el plan
- [x] T011 [P] Comprobar las cabeceras en el contenedor — `frontend/scripts/probar-nginx.mjs` — hecho cuando: con la imagen actual falla por la razón esperada (faltan las cabeceras) y comprueba las seis cabeceras con su valor en `/`, cada ruta de `RUTAS_PUBLICAS`, `/login`, `/admin/usuarios`, `/restablecer-contrasena?token=x`, `/no-existe` (404), `/nosotros/` (301), un `/assets/*.js` e `/images/hero-dentissa.webp`, y que `/login` y las privadas conservan `X-Robots-Tag: noindex` y la 404 su `<meta name="robots" content="noindex">` en el cuerpo (`/analyze` A3) — cubre: CA1, CA2, CA3, CA8, CA9
  - nota: con la imagen actual fallan por la razón esperada las 14 comprobaciones nuevas (13 respuestas sin cabeceras y la 404 con su `<meta>` `noindex` pero sin cabeceras); las anteriores siguen pasando. `probar-nginx` (CI) queda en rojo hasta T021
- [x] T013 [P] Escribir la prueba de los recursos del código — `frontend/tests/seguridad-recursos.test.js` — hecho cuando: falla por la razón esperada (`via.placeholder.com` en `api.js`) y comprueba: toda URL absoluta de `frontend/src` está en la lista de enlaces y datos del plan o en los orígenes de la CSP (leídos de `nginx-seguridad.conf` si existe; si no, de la tabla del plan copiada en la prueba); el marcador de `getImageUrl` es una ruta del sitio; si el código usa `URL.createObjectURL`, `img-src` permite `blob:` — cubre: CA7
  - nota: añadida por `/analyze` A2, A6
  - nota: A14 — lista cerrada en la prueba, con motivo por entrada: `w3.org` (espacio de nombres de SVG), `localhost` (respaldo de desarrollo de la API; se compara sin puerto), `wa.me`, `facebook.com` e `instagram.com` (enlaces), `schema.org` y `sitemaps.org` (vocabularios) y el propio sitio. Falla por la razón esperada en dos ejecuciones: la única URL fuera es `https://via.placeholder.com/60` (`api.js`); el marcador no es del sitio; `img-src` sin `blob:` (aún no existe `nginx-seguridad.conf`)
- [x] T012 [P] Crear el recorrido del navegador con la CSP — `frontend/scripts/probar-csp.mjs` — hecho cuando: construye la imagen con el client ID de `frontend/.env` (sin mostrarlo), la levanta y, con Chrome sin cabeza, recorre las seis páginas públicas, la 404, `/restablecer-contrasena`, contacto con "Ver mapa" (también llegando desde la portada sin recargar) y el login con los dos botones de Google; registra los bloqueos de la CSP por página; prueba los dos abusos (una página de otro origen que incrusta el sitio en un `iframe` y un `<script src>` de otro origen añadido a una página del sitio) y termina con error si alguno se carga o si hay bloqueos. Con la imagen actual (sin CSP) falla por la razón esperada: los dos abusos no se bloquean — cubre: CA3, CA4, CA5, CA6, CA7
  - nota: contra la imagen v1.4.1 (sin CSP) falla por la razón esperada en tres ejecuciones: los dos abusos no se bloquean; las 11 comprobaciones de páginas, mapa y botones de Google pasan. El abuso del `iframe` se hace desde `http://127.0.0.1:<puerto>` (otro origen) y se sigue el marco con `Target.setAutoAttach`: Chrome mueve el marco de otro origen a otro proceso y sale de `Page.getFrameTree`, así que la versión con `data:` y el árbol de marcos daba "bloqueado" sin marco. Ahora falla si no se crea el marco. Las páginas esperan el evento de carga además del margen. Si falla `docker build`, el error no muestra el client ID

## Implementación
- [x] T020 Crear el archivo de cabeceras de seguridad — `frontend/nginx-seguridad.conf` — hecho cuando: los casos de T010 sobre el contenido del archivo pasan (dos ejecuciones) — cubre: CA1, CA2, CA3, CA4 — depende: T010
  - nota: los 25 casos de T010 sobre el contenido pasan en dos ejecuciones; quedan en rojo los 2 de T021 (`include` en cada `location` y copia en el `Dockerfile`). Comentarios en el archivo con el motivo de cada cabecera y la regla para añadir un servicio externo
- [x] T021 Incluir las cabeceras en cada `location` propia y copiarlas en la imagen — `frontend/nginx.conf`, `frontend/Dockerfile` — hecho cuando: T010 completo y T011 pasan; los demás casos de `probar-nginx.mjs` siguen en verde; comprobado rompiendo (quitar el `include` de una `location` y una cabecera del archivo → T010 y T011 fallan) — cubre: CA1, CA2, CA3, CA8, CA9 — depende: T011, T020
  - nota: T010 (27/27), T013 (3/3) y la prueba de nginx de la 023 pasan en dos ejecuciones; `probar-nginx.mjs` completo en verde (las 14 nuevas y las anteriores); frontend 220/220. Comprobado rompiendo: sin el `include` de `/galeria` y sin `Permissions-Policy` en el archivo, T010 falla en 3 casos (presencia, valor e `include`) y `probar-nginx` en las 13 respuestas; restaurado, todo en verde. `include` en las 12 `location` propias (redirección, 6 públicas, `/assets/`, `/login`, privadas, `/` y `/404.html`); `/api/` y `/uploads/` sin él
- [x] T025 [P] Sustituir el marcador externo de "sin imagen" por uno propio — `frontend/src/services/api.js`, `frontend/public/images/sin-imagen.svg` — hecho cuando: T013 pasa (dos ejecuciones) y los tests de la app siguen en verde; el SVG es neutro, de 60×60 y sin texto · verificación manual: en la lista de usuarios, un registro sin foto muestra el marcador (captura en T023) — cubre: CA7 — depende: T013
  - nota: añadida por `/analyze` A2
  - nota: A13 — SVG de 60×60 sin texto, fondo `--tint` (#fff7f8) y figura `--muted` (#64748b) de `docs/design/system.md`; `aria-label="Sin imagen"`. T013 pasa (3/3, dos ejecuciones); frontend 218 tests en verde salvo los 2 de T021. La captura del marcador va en T023
- [x] T022 Verificar en el navegador las páginas públicas, el mapa y el login — `frontend/scripts/probar-csp.mjs` (solo ejecución), `.ai/inspect/024-despues/ (generado por scripts/capturas.mjs)` — hecho cuando: T012 pasa contra la imagen de T021 (cero bloqueos; los dos abusos bloqueados; los dos botones de Google y el mapa visibles) en dos ejecuciones · verificación manual: capturas de portada, contacto con el mapa y login a 390 y 1440 px iguales a las de T001 — cubre: CA3, CA4, CA5, CA6, CA7 — depende: T012, T021
  - nota: `probar-csp.mjs` corregido en esta tarea: la página "ajena" del abuso del iframe la servía el propio sitio, y su `frame-src` habría bloqueado el marco por la razón equivocada; ahora la sirve un servidor propio sin CSP (`127.0.0.1:8092`) y se lee el documento real del marco (sesión del objetivo `iframe`). Comprobado en los dos sentidos: con la imagen v1.4.1 (sin CSP) fallan solo los dos abusos y el marco muestra `http://localhost:8093/login`; con la imagen de T021 pasan
  - nota: T012 pasa contra la imagen de T021 en dos ejecuciones (una con build, otra `--sin-build`): las 11 comprobaciones sin bloqueos de la CSP (seis públicas, 404, restablecer contraseña, mapa directo y sin recargar, login con los dos botones de Google directo y sin recargar) y los dos abusos bloqueados (`chrome-error://chromewebdata/`)
  - nota: verificación manual OK 2026-11-19 (Claude, Chrome sin cabeza): capturas de portada, contacto con el mapa y login a 390 y 1440 px en `.ai/inspect/024-despues/` iguales a las de T001 (`024-antes/`); la única diferencia es el estado de carga de las etiquetas dentro del mapa de Google. En Git Bash, `capturas.mjs --rutas` necesita `MSYS_NO_PATHCONV=1`
  - nota: verificación manual OK 2026-11-21 (usuario): capturas de `024-antes/` y `024-despues/` iguales. La variación de unos píxeles en el pie de inicio a 1440 también aparece entre dos capturas de v1.4.1 (`024-antes-r1`/`r2`): ruido de la captura
- [ ] T023 Recorrer los paneles con una cuenta de cada rol — `.ai/inspect/024-paneles/` (registro de bloqueos y capturas) — hecho cuando: con la imagen de T021 conectada al backend y la BD locales, sesiones de Administrador, Asistente y Paciente recorren: inicio, citas (crear y reprogramar), historial, usuarios, servicios, promociones, galería, comentarios, preguntas frecuentes, reportes con exportación a Excel, y el portal del paciente con su cita, su QR y su perfil; se sube una imagen con vista previa en galería, promociones, servicios y usuarios y se abre un registro sin foto (marcador propio de T025). Cero bloqueos de la CSP en la consola · verificación manual: recorrido de los paneles (Claude con cuentas de prueba locales o el usuario) — cubre: CA7 — depende: T021, T025
- [ ] T024 Medir el resultado y correr la suite — `.ai/inspect/024-despues/ (generado por scripts/medir-rendimiento.mjs)` — hecho cuando: mediana de 5 con `benchmarkIndex` ≥ 2000: Rendimiento ≥ T001 − 2 en cada ruta, Prácticas recomendadas ≥ T001 y SEO 100; `npm test`, lint de los archivos tocados y `npm audit --omit=dev` sin altas — cubre: CA7 — depende: T014, T022, T023

## Integración y documentación
- [x] T090 Actualizar `docs/architecture.md` si cambió la estructura — `docs/architecture.md` — hecho cuando: la sección del frontend y nginx describe `nginx-seguridad.conf`, qué respuestas lo llevan (no `/api/` ni `/uploads/`) y la regla "un servicio externo nuevo exige actualizar la CSP y `seguridad-cabeceras.test.js`"
  - nota: sección "Frontend" de `docs/architecture.md`: cabeceras, el archivo único, qué respuestas lo llevan, la CSP única y la regla para añadir un servicio externo (incluido el origen de `VITE_ASSETS_URL`)
- [x] T091 Actualizar `docs/deployment.md` y `docs/observability.md` si cambiaron variables, entornos, pasos de deploy, logs, eventos de auditoría o métricas — `docs/deployment.md` — hecho cuando: "Verificación post-deploy" incluye `curl -sI` a la portada, `/login` y `/no-existe` con las seis cabeceras, y la consola sin bloqueos en el login con Google y en contacto; `observability.md` sin cambios (no hay logs ni métricas)
  - nota: `docs/deployment.md` → "Verificación post-deploy": `curl -sI` a `/`, `/login` y `/no-existe` con las seis cabeceras y la consola sin bloqueos en el login con Google y en contacto (`probar-csp.mjs` en local). `observability.md` sin cambios: no hay logs, eventos ni métricas nuevos
- [ ] T092 Marcar spec como `implemented`

## Despliegue (lo ejecuta `/release`)
- [ ] T095 Desplegar a staging y verificar criterios de aceptación
  - nota: no hay staging (`docs/deployment.md`); las verificaciones se hacen con el contenedor local (T022, T023)
- [ ] T096 Aprobación humana para producción
- [ ] T097 Desplegar a producción y vigilar métricas del plan (Rollout)
  - `curl -sI https://sistema.dentissa.app/` con las seis cabeceras, HSTS incluido (usuario, CA2)
  - Entrar con Google de verdad y abrir el mapa de contacto, con la consola sin bloqueos (usuario, CA5, CA6)
- [ ] T098 Marcar spec como `released`

## Cobertura
| Criterio | Tarea(s) de test | Tarea(s) de implementación |
|---|---|---|
| CA1 | T010, T011 | T020, T021 |
| CA2 | T010, T011 | T020, T021 |
| CA3 | T010, T011, T012 | T020, T021, T022 |
| CA4 | T010, T012 | T020, T022 |
| CA5 | T012 | T022 |
| CA6 | T012 | T022 |
| CA7 | T012, T013 | T022, T023, T024, T025 |
| CA8 | T011 | T021 |
| CA9 | T010, T011 | T021 |

| Amenaza (TM#) | Tarea(s) de control | Tarea(s) de test |
|---|---|---|
| TM1 | T020, T021 | T010, T011, T012 |
| TM2 | T020 | T010, T012 |
| TM3 | T020 | T010 |
| TM4 | T020, T021 | T010, T011 |
| TM5 | T020, T021 | T011 |
| TM6 | T020, T021 | T011 |
| TM7 | T021 | T010 |

| Cambio del plan (módulo) | Tarea(s) |
|---|---|
| `frontend/nginx-seguridad.conf` | T020 |
| `frontend/nginx.conf` | T021 |
| `frontend/Dockerfile` | T021 |
| `frontend/tests/seguridad-cabeceras.test.js` | T010 |
| `frontend/scripts/probar-nginx.mjs` | T011 |
| `frontend/scripts/probar-csp.mjs` | T012, T022 |
| `frontend/tests/seguridad-recursos.test.js` | T013 |
| `frontend/src/services/api.js`, `frontend/public/images/sin-imagen.svg` | T025 |
| `docs/architecture.md` | T090 |
| `docs/security.md` | RS6.a y RS6.b mitigadas en `/release` (Paso 7, T098) |

| Requisito no funcional | Tarea(s) de test o verificación manual (T095) |
|---|---|
| Rendimiento −2 como máximo | T014, T001, T024 |
| Prácticas recomendadas sin bajar | T014, T001, T024 |
| Descubribilidad sin cambios (SEO 100, noindex) | T011, T024 |
| Sin cambios visibles (P16) | T001, T022 |
