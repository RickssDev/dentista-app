---
spec: 023-rendimiento-sitio
plan: plan.md
impl_base: 5f33c0c
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
- Cada commit deja `npm run build` en verde: las reglas de la guarda del build se activan en la tarea
  que las hace pasar (`/analyze` A3). Los tests nuevos se confirman fallando por la razón esperada y
  quedan en rojo hasta su tarea; `probar-nginx` (CI) queda en rojo de T017 a T029, y el PR se abre al
  final (`/analyze` A33).
- Versión anterior: [history/tasks.v1.md](history/tasks.v1.md) (regenerada por `/analyze` ronda 1).

## Constitution Check
Revisión del desglose contra `plan.md` (constitución 1.0.0).

| Principio | Resultado | Justificación / ajuste | Cómo se verifica |
|---|---|---|---|
| P1 Spec antes de implementar | ✅ | Spec, `design.md` y plan aprobados antes de T001 | manual: `aidd.py validate` |
| P2 Tests por feature | ✅ | Cada tarea de implementación depende de su tarea de test, escrita antes | test: T010–T018 |
| P3 Dependencias nuevas con ADR | ✅ | T001 instala la única dependencia (ADR 0010) | manual: ADR 0010 |
| P4 Arquitectura con ADR | ✅ | ADR 0010; T090 actualiza arquitectura y SEO | manual: T090 |
| P5 Producción solo con aprobación humana | ✅ | T096 | manual: T096 |
| P6 Rollback documentado | ✅ | Rollout del plan; sin datos | manual: T096 |
| P7 Migraciones compatibles | ➖ | Sin esquema | — |
| P8 Autorización en el servidor | ➖ | Sin endpoints | — |
| P9 Entrada validada | ➖ | Sin entradas nuevas | — |
| P10 Secretos | ✅ | Solo `VITE_*` públicas; el client ID se lee de `.env` sin mostrarlo | test: gitleaks en CI; TM1 en T013 |
| P11 Vulnerabilidades | ✅ | T001 comprueba `npm audit` tras instalar | test: `npm audit` en T001 y T060 |
| P12 Modelo de amenazas | ✅ | TM1 con test (T013, T015) y control (T020, T027) | test: T013 |
| P13–P15 | ➖ | Sin datos sensibles ni logs | — |
| P16 Accesibilidad | ✅ | Contraste, foco y teclado del bloque probados | test: T011, T014; manual: T026, T060 |
| P17 Sin lógica en las vistas | ✅ | Imágenes en `site.js`; títulos, módulos y guardas en `src/seo/` | manual: `/review` |
| P18 Metadatos por ruta indexable | ✅ | Sin cambios en las públicas; los tests de la 022 siguen | test: suite en T060 |
| P19 Noindex fuera de lo público | ✅ | `login.html` con `noindex`, sin canónica, fuera del sitemap; `X-Robots-Tag` en `/login` | test: T015, T017 |
| P20 Sistema de diseño | ✅ | Sin colores literales en las reglas nuevas del bloque | test: T014 |

## Preparación
- [x] T001 Instalar `@fontsource-variable/plus-jakarta-sans@5.3.0` — `frontend/package.json`, `frontend/package-lock.json` — hecho cuando: `npm ci --prefix frontend` instala sin scripts de instalación y `npm audit --audit-level=high --prefix frontend` sigue sin altas ni críticas
  - nota: 5.3.0 instalada con `--ignore-scripts`; el paquete no declara scripts (`{}`), licencia OFL-1.1; `npm ci` correcto; `npm audit`: 0 vulnerabilidades. El aviso de `install-scripts` de `npm ci` es de otra dependencia, previo
  - nota: corrección tras T029: la dependencia nueva faltaba en `backend/tests/seguridad/dependencias-produccion.json` (control P3 de la spec 018, `cadena-suministro.test.js`); registrada
- [x] T002 Crear el script de medición y medir la línea base — `frontend/scripts/medir-rendimiento.mjs` — hecho cuando: el script construye la imagen del frontend con `--build-arg VITE_GOOGLE_CLIENT_ID` leído de `frontend/.env` (o del entorno) sin escribirlo en la salida, la levanta con `--add-host backend:127.0.0.1`, pasa Lighthouse 13.6.0 móvil 3 veces por cada una de las siete rutas y escribe la mediana de Rendimiento, LCP, CLS, SEO y Accesibilidad; la tabla de partida queda anotada como nota de esta tarea
  - nota: requisito previo: la ficha `2026-11-17-fix-dockerfile-google-client-id` (PR #78) fusionada en `main` e integrada en esta rama
  - nota: línea base 2026-11-17 (`main` con el PR #78, imagen con client ID de Google, backend ficticio), mediana de 3 — `/` 78 (78/70/80), LCP 5,2 s · `/nosotros` 75 (44/76/75), 6,6 s · `/galeria` 99, 1,7 s · `/contacto` 96 (98/96/65), 1,9 s · `/aviso-de-privacidad` 70 (70/100/69), 1,5 s · `/terminos-de-servicio` 98, 1,7 s · `/login` 84 (84/84/84), 4,4 s. CLS ≤ 0,005 en todas. SEO 100 en las públicas; `/login` 66 por su `noindex` deliberado (`is-crawlable`). Accesibilidad: 96, 96, 98, 94, 100, 100 y 93
  - nota: Lighthouse varía mucho en este equipo (aviso 70/100/69, contacto 98/96/65): en T060 se usarán 5 corridas si la mediana de 3 queda en duda
- [x] T003 Crear el script de capturas y capturar el estado actual — `frontend/scripts/capturas.mjs` — hecho cuando: con Chrome sin cabeza y el protocolo de DevTools (WebSocket de Node 22, `Page.captureScreenshot` con `captureBeyondViewport`), guarda capturas de página completa a 390 y 1440 px de las siete rutas en `.ai/inspect/023-<etiqueta>/`, y quedan las de `antes` (14 archivos) — depende: T002
  - nota: 14 capturas `antes` en `.ai/inspect/023-antes/` (página completa, movimiento reducido para que los revelados aparezcan). Revisada `contacto-390.png`: página completa con el bloque del mapa actual

## Tests (antes de implementar)
- [x] T010 [P] Escribir las pruebas de recursos locales — `frontend/tests/rendimiento-recursos.test.js` — hecho cuando: falla por la razón esperada y comprueba: `index.html` sin `fonts.googleapis.com`, `fonts.gstatic.com`, `images.unsplash.com` ni `<link rel="icon" type="image/jpeg">`; `IMAGES` de `site.js` sin URL externas y sin `contact`; existen `public/images/nosotros-{600,900,1200}.webp` con ese ancho (cabecera WebP); `global.css` declara "Plus Jakarta Sans Variable" en `--font`; `main.jsx` importa `@fontsource-variable/plus-jakarta-sans`; el CSS del paquete usa `font-display: swap` — cubre: CA7, CA8
  - nota: 6/7 fallan por la razón esperada (Google Fonts en `index.html`, `--font` sin la variable, `IMAGES.about` de Unsplash, sin WebP de nosotros). El de `font-display: swap` pasa desde ya: comprueba el paquete instalado en T001
- [x] T011 [P] Escribir las pruebas del bloque del mapa — `frontend/tests/rendimiento-mapa.test.jsx` — hecho cuando: falla por la razón esperada y comprueba en `Contact`: sin `iframe` al montar; enlace "Ver mapa" con `href` = `mapLink`; al activarlo con clic y con Enter aparece el `iframe` "Ubicación de Dentissa en Google Maps", el evento se cancela (no navega) y el foco queda en el `iframe`; "Cómo llegar" está antes y después; el `.map` tiene las mismas clases de tamaño antes y después (K2); ejecutada dos veces — cubre: CA6
  - nota: 3/3 fallan por la razón esperada en dos ejecuciones (hoy el `iframe` está al abrir y no existe el enlace "Ver mapa"). K2 se comprueba con el mismo nodo `.map` y sus clases sin estado (`is-*`) y estilo en línea iguales antes y después
- [x] T012 [P] Escribir las pruebas de carga sin Google, del título del login y de la recarga de chunks — `frontend/tests/rendimiento-carga.test.jsx` — hecho cuando: falla por la razón esperada y comprueba: `main.jsx` no usa `GoogleOAuthProvider` y `login.jsx` sí; al montar el login (con `@react-oauth/google` simulado), `document.title` es "Iniciar sesión | Dentissa"; `cargarPagina` de `App.jsx` recarga la página una sola vez cuando el `import()` falla (con `location.reload` simulado y la marca en `sessionStorage`); y además que al montar `AppRoutes` en `/`, `/nosotros` y `/contacto` no se inserta ningún `<script>` de `accounts.google.com` (pasa hoy y se mantiene, `/analyze` A15); ejecutada dos veces — cubre: CA4, CA5
  - nota: 5/8 fallan por la razón esperada en dos ejecuciones (`GoogleOAuthProvider` en `main.jsx` y no en el login, título del login, `cargarPagina` aún no exportada por `App.jsx`). Los 3 de `AppRoutes` sin scripts de Google pasan hoy (A15). `cargarPagina(importar, recargar)` recibe la recarga como parámetro para poder simularla en jsdom
- [x] T013 Escribir las pruebas de las guardas del build — `frontend/tests/rendimiento-guardas.test.js`, `frontend/src/seo/guardas.js` (firmas que lanzan "sin implementar") — hecho cuando: falla por la razón esperada y comprueba con manifiestos y HTML de ejemplo: `hostsProhibidos` devuelve cada host de la lista del plan y nada en un HTML limpio; `modulosPrivadosEnEntrada` señala un módulo de la lista que no es `isDynamicEntry` o cuyo chunk está en el cierre de `imports` de `index.html`, y nada si son entradas dinámicas fuera del cierre; `datosDeSesion` señala un JWT (`eyJ…`), un `"token"` o un correo en el texto o en un `value`, y nada en un HTML con `placeholder="tu@correo.com"` como el del login real (TM1) — cubre: CA4, CA7, CA8
  - nota: 15/16 fallan con "sin implementar" (firmas de `guardas.js`); pasa solo la lista `HOSTS_PROHIBIDOS`, que es dato. El caso limpio de TM1 usa los `placeholder="tu@correo.com"` del login real (A29)
  - nota: corrección tras T029: el caso limpio de TM1 lee los `placeholder` de correo del `login.jsx` real en lugar de copiar `tu@correo.com` (regla CA8 de la spec 018: en las pruebas solo `@example.test`), y un caso exige que existan para que el limpio pruebe algo (A29)
- [x] T014 [P] Escribir las pruebas de estilos del bloque del mapa — `frontend/tests/rendimiento-estilos.test.js` — hecho cuando: falla por la razón esperada y comprueba con los valores de los tokens de `global.css`: contraste ≥ 4,5:1 de `--ink` sobre `--tint`, `--muted` sobre `--tint`, blanco sobre `--primary-700` y `--ink` sobre blanco; contraste ≥ 3:1 de `--muted` sobre blanco (borde de "Cómo llegar") y de `--primary-600` sobre `--tint` (anillo de foco); la regla global `:focus-visible` tiene contorno ≥ 2 px; en `Contact.css`, "Ver mapa" (`.map__ver`) usa `var(--primary-700)` de fondo, "Cómo llegar" del bloque usa `var(--muted)` de borde, el estado inicial de `.map` usa `var(--tint)` sin `animation`, y ninguna regla de `.map` (`.map`, `.map.*`, `.map__*`) contiene colores literales (`#…`, `rgb(`, `hsl(`) — cubre: CA6
  - nota: 4/11 fallan por la razón esperada (sin `.map__ver` ni `.map__llegar`; `.map` con brillo animado y literales). Los 7 de contraste y foco pasan desde ya: comprobado rompiendo `--primary-700`, `--muted` y el contorno de foco (fallan los casos afectados) y restaurado `global.css`
- [x] T015 Ampliar las pruebas del HTML generado y crear las firmas del login — `frontend/tests/seo-prerender.test.jsx`, `frontend/src/seo/rutas.js` (`TITULO_LOGIN = "Iniciar sesión | Dentissa"`), `frontend/src/seo/cabecera.js` (`paginaLogin` que lanza "sin implementar") — hecho cuando: falla por la razón esperada (sin romper los casos de la 022: las llamadas nuevas van dentro de cada `test`) y comprueba: `hostsProhibidos` vacío en las seis páginas y en `paginaLogin(...)`; en la portada, el contenedor de la foto principal lleva `is-priority` y no `is-loading`; en nosotros, la foto principal es `loading="eager"` con `srcset` de `/images/nosotros-*.webp`; en contacto no hay `<iframe` y sí el enlace "Ver mapa"; `paginaLogin` lleva `noindex`, `TITULO_LOGIN` y el formulario de acceso, no lleva canónica, Open Graph ni JSON-LD, y `datosDeSesion` sale vacío — cubre: CA2, CA3, CA6, CA7, CA8 — depende: T013
  - nota: 12 casos nuevos fallan por la razón esperada ("sin implementar" en `hostsProhibidos` y `paginaLogin`; portada con `is-loading`; nosotros desde Unsplash y diferida; contacto con `iframe`); los 47 de la 022 siguen en verde (llamadas nuevas dentro de cada `test`). `render('/login')` funciona hoy sin proveedor de Google en el servidor; el build sigue en verde
- [x] T016 Añadir el login a la prueba de hidratación — `frontend/tests/seo-hidratacion.test.jsx`, `frontend/tests/support/prerenderizar.mjs` — hecho cuando: `/login` se prerenderiza en el ayudante y se hidrata sin errores recuperables ni de hidratación; hoy falla porque `GoogleLogin` no tiene proveedor dentro de `AppRoutes`; ejecutada dos veces — cubre: CA5, CA9
  - nota: falla por la razón esperada en dos ejecuciones: "Google OAuth components must be used within GoogleOAuthProvider" (el proveedor está en `main.jsx`, fuera de `AppRoutes`). `tests/support/prerenderizar.mjs` no necesitó cambios: ya acepta las rutas como argumentos y la prueba le pasa `/login`
- [x] T017 [P] Ampliar la prueba de nginx — `frontend/scripts/probar-nginx.mjs` — hecho cuando: comprueba `/login` → 200 con `X-Robots-Tag: noindex` y el formulario en el HTML; `/`, un `/assets/*.js`, un `/assets/*.css`, `/sitemap.xml` y `/robots.txt` con `Accept-Encoding: gzip` → `Content-Encoding: gzip`; un `/assets/*` → `Cache-Control` con `max-age=31536000` e `immutable`; contra la imagen actual fallan solo los casos nuevos — cubre: CA10
  - nota: contra la imagen actual fallan solo los 7 casos nuevos (login sin formulario en el HTML, sin gzip en HTML, JS, CSS, XML y texto, sin `Cache-Control` en `/assets/`); las 22 anteriores siguen pasando. Las peticiones de gzip piden `Accept-Encoding: gzip` y leen la cabecera tal como llega

- [x] T018 [P] Escribir la prueba de la foto con prioridad — `frontend/tests/smartimage-prioridad.test.jsx` — hecho cuando: falla por la razón esperada y comprueba que `SmartImage` con `priority` lleva `is-priority` y no `is-loading` al montarse y tras el evento `load`, y que en `global.css` la regla de `.is-priority img` no aplica `opacity: 0`; ejecutada dos veces — cubre: CA3
  - nota: 3/4 fallan por la razón esperada en dos ejecuciones (sin `is-priority` ni regla CSS). El caso "sin priority sigue con is-loading" pasa hoy a propósito: protege que el cambio no afecte al resto de imágenes

## Implementación
- [x] T020 Implementar las guardas del build — `frontend/src/seo/guardas.js` — hecho cuando: T013 pasa · comprobado rompiendo cada regla (un host quitado de la lista, `isDynamicEntry` ignorado, el patrón JWT quitado) — cubre: CA4, CA7, CA8 — depende: T013
  - nota: T013 pasa (16/16). Comprobado rompiendo: sin `maps.googleapis.com` en la lista falla el caso de la lista; ignorando `isDynamicEntry` fallan los dos casos de módulo incrustado o no dinámico; sin el patrón JWT falla su caso (TM1). Restaurado, 16/16. El build no usa aún las guardas (se activan en T021, T027 y T028)
- [x] T021 Cargar bajo demanda el login, el panel, el portal y restablecer contraseña, y activar la guarda de módulos privados — `frontend/src/App.jsx` (`cargarPagina` con recarga única), `frontend/src/seo/rutas.js` (`MODULOS_PRIVADOS`), `frontend/scripts/prerender.mjs` — hecho cuando: la parte de `cargarPagina` de T012 pasa; cada ruta privada usa `lazy(cargarPagina(...))` dentro de su `<Suspense fallback={<p>Cargando página...</p>}>`; el build pasa con la guarda de módulos privados activa y falla si se vuelve a importar `AdminPanel` de forma estática (comprobado rompiendo); los tests del panel, el portal y el login siguen en verde · verificación manual: en la build local, entrar desde el login al panel y al portal y recargar en `/admin/...` y `/paciente/...` — cubre: CA4 — depende: T012, T015, T020
  - nota: la parte de `cargarPagina` de T012 pasa; el JavaScript de entrada baja de 404 KiB a 271 KiB (87 KiB gzip) y su CSS a 22 KiB (`adminpanel.css` y `login.css` salen a sus chunks). Build en verde con la guarda de módulos privados activa. Comprobado rompiendo: con `AdminPanel` importado y usado de forma estática, el build se detiene con "src/pages/admin/AdminPanel.jsx: forma parte del JavaScript de entrada"; restaurado, verde
  - nota: archivo extra justificado: `tests/seo-hidratacion.test.jsx` (de T016). Con el login bajo demanda, la prueba terminaba antes de que llegara su módulo y pasaba sin hidratar; ahora espera al módulo y vuelve a fallar por la razón esperada (sin `GoogleOAuthProvider`) hasta T022. No se debilita: se refuerza
  - nota: verificación manual 2026-11-17 (Claude, build local con client ID y backend ficticio, sesión simulada en `localStorage`): `/` no pide chunks privados; recargar en `/admin/citas` descarga `AdminPanel-*.js` y pinta el panel; `/paciente/perfil` descarga `PerfilPaciente-*.js` y pinta el portal (los datos fallan por no haber backend). Entrar desde el login al panel requiere backend: queda para T060 con el usuario
- [x] T022 Montar el inicio de sesión con Google solo en el login y darle su título — `frontend/src/main.jsx`, `frontend/src/pages/admin/login.jsx`, `frontend/tests/login-redireccion.test.jsx` — hecho cuando: T012 pasa completo (dos ejecuciones); el login pone `document.title = TITULO_LOGIN` al montarse; el mock de `@react-oauth/google` añade un `GoogleOAuthProvider` que solo pinta a sus hijos y los tests del login y de la 022 siguen en verde · verificación manual: con la build local (client ID de `frontend/.env`) y Chrome sin cabeza, `/login` pide `accounts.google.com/gsi/client` y muestra el contenedor del botón, y `/`, `/nosotros` y `/contacto` no lo piden (Claude) — cubre: CA5 — depende: T012, T021
  - nota: entrar con Google de verdad requiere la cuenta del usuario; se comprueba en producción en T097 (decisión del usuario, 2026-11-17)
  - nota: T012 completo (8/8) y T016 (login hidratado sin errores) pasan, dos ejecuciones; los tests del login (`login-redireccion`) y de la 022 (`seo-metadatos`) siguen en verde. `login.jsx` exporta `LoginConGoogle`, que envuelve el formulario en `GoogleOAuthProvider`; `main.jsx` ya no lo usa
  - nota: verificación manual OK 2026-11-17 (Claude, build local con el client ID de `frontend/.env`, Chrome sin cabeza y protocolo de DevTools): `/`, `/nosotros` y `/contacto` no piden nada a `accounts.google.com`; `/login` pide `/gsi/client`, `/gsi/style` y `/gsi/button`, monta `.google-btn` y su título es "Iniciar sesión | Dentissa"
- [x] T023 Pintar la foto principal sin esperar a JavaScript y aceptar `srcSet` — `frontend/src/components/home/SmartImage.jsx`, `frontend/src/styles/home/global.css` — hecho cuando: T018 (dos ejecuciones) y el caso de la portada de T015 pasan; T016 y la hidratación de la 022 siguen en verde; `SmartImage` pasa `srcSet` al `<img>` · verificación manual: la portada sin JavaScript muestra la foto — cubre: CA3 — depende: T015, T018
  - nota: T018 (4/4, dos ejecuciones) y el caso de la portada de T015 pasan; T016 y la hidratación de la 022 siguen en verde. Con `priority` el estado inicial es `loaded` y se añade `is-priority` (mismo HTML en servidor y cliente); `.smart-img.is-priority img` con `opacity: 1` y sin transición. El prerender de la portada sale con `smart-img is-loaded is-priority hero__image`
  - nota: verificación manual OK 2026-11-17 (Claude, Chrome sin cabeza con JavaScript desactivado): la foto de la portada se ve a 390 y 1440 px (opacidad 1, cargada); captura en `.ai/inspect/023-t023/`
- [x] T024 Servir Plus Jakarta Sans desde el sitio y quitar los recursos externos de la plantilla — `frontend/index.html`, `frontend/src/main.jsx`, `frontend/src/styles/home/global.css` — hecho cuando: la parte de fuentes e `index.html` de T010 pasa · verificación manual: la tipografía se ve igual en las capturas de la portada (antes y después) — cubre: CA8 — depende: T001, T010, T022, T023
  - nota: la parte de fuentes e `index.html` de T010 pasa (las 4 que faltan son de la foto, T025). `--font` empieza por "Plus Jakarta Sans Variable" y conserva "Plus Jakarta Sans" y la reserva; el build sirve los `woff2` por subconjunto (latin 27 KiB) desde `/assets/` y el CSS de entrada pasa de 22 a 26 KiB por los `@font-face`. Fuera de `index.html` los `preconnect` a Google Fonts y Unsplash, la hoja de Google Fonts y el ícono JPEG (el archivo `favicon.jpeg` se queda y sigue sirviéndose)
  - nota: verificación manual OK 2026-11-17 (Claude): la portada a 1440 px se ve igual antes y después (misma tipografía, saltos de línea y tamaños); capturas en `.ai/inspect/023-t024/`
- [x] T025 Alojar la foto de nosotros en WebP y quitar la de contacto sin uso — `frontend/public/images/nosotros-*.webp (generado por descarga de Unsplash con fm=webp&w=N&q=70)`, `frontend/src/data/site.js`, `frontend/src/pages/About.jsx` — hecho cuando: la parte de fotos de T010 y el caso de nosotros de T015 pasan — cubre: CA2, CA7 — depende: T010, T015, T023
  - nota: T010 completo (7/7) y el caso de nosotros de T015 pasan (dos ejecuciones con la hidratación). WebP descargados de Unsplash con `auto=format&fit=crop&w=N&q=70&fm=webp` (los mismos parámetros de hoy, en WebP): 600 → 36 KB, 900 → 71 KB, 1200 → 109 KB. Nosotros sale con `priority` (`eager`, `fetchPriority=high`), `srcSet` y `sizes`; `IMAGES.contact` eliminado (sin uso)
  - nota: archivo tocado por lint: `About.jsx` tenía un import sin uso previo (`usePublicData`) que el lint del CI marca en los archivos del PR; se quita, sin cambio de comportamiento
- [x] T026 Construir el bloque del mapa bajo demanda — `frontend/src/pages/Contact.jsx`, `frontend/src/styles/home/Contact.css` — hecho cuando: T011 (dos ejecuciones), T014 y el caso de contacto de T015 pasan · verificación manual: capturas del bloque a 390 y 1440 px en sus dos estados contra `design.md` (K1, K2); "Ver mapa" con ratón y con teclado (usuario) — cubre: CA6 — depende: T011, T014, T015
  - nota: T011 (dos ejecuciones), T014 y el caso de contacto de T015 pasan. `MapaContacto` en `Contact.jsx`: vista previa con dirección, "Ver mapa" (`mapLink`, fondo `--primary-700`) que con JavaScript monta el `iframe` y le pasa el foco, y "Cómo llegar" `ghost` con borde `--muted` en los dos estados; `.map` con fondo `--tint` sin brillo animado. En T011, `toHaveAttribute` (jest-dom, no configurado) se sustituye por `getAttribute('href')`, que es la misma comprobación
  - nota: verificación (Claude, Chrome sin cabeza, build local): el bloque mide lo mismo antes y después de "Ver mapa" (358×448 a 390 px, 1136×487 a 1440 px; K2); "Ver mapa" 114×46 y "Cómo llegar" 158×46 (K1); el foco pasa al `iframe` "Ubicación de Dentissa en Google Maps". Capturas en `.ai/inspect/023-t026/`
  - nota: desbloqueada 2026-11-17 — verificación manual OK 2026-11-17 (usuario): "Ver mapa" funciona con ratón y con teclado
- [x] T027 Prerenderizar el login con `noindex` y la guarda TM1 — `frontend/scripts/prerender.mjs`, `frontend/src/seo/rutas.js` (`TITULO_LOGIN`), `frontend/src/seo/cabecera.js` (`paginaLogin`) — hecho cuando: el build genera `dist/login.html` con `paginaLogin` (`TITULO_LOGIN`, `noindex`, CSS de su chunk) y falla si `login.html` lleva canónica o `datosDeSesion` encuentra algo (comprobado rompiendo); los casos de login de T015 y T016 pasan; `sitemap.xml` sigue sin `/login` — cubre: CA2, CA5, CA9 — depende: T015, T016, T020, T022
  - nota: los casos de login de T015 y T016 pasan (71/71 con `seo-archivos`, dos ejecuciones). `paginaLogin` usa `construirPagina` con `noindex` y `TITULO_LOGIN`; `dist/login.html` (5,5 KB) lleva el formulario, `noindex` y `/assets/login-*.css`; `sitemap.xml` sigue sin `/login`
  - nota: comprobado rompiendo: con el login construido como página indexable el build se detiene ("sin noindex", "no puede llevar canónica"); con un correo añadido al cuerpo se detiene con "contiene datos de sesión" (TM1). Restaurado, verde
- [x] T028 Activar la guarda de hosts prohibidos en las siete páginas — `frontend/scripts/prerender.mjs` — hecho cuando: el build pasa con `hostsProhibidos` activo sobre las seis páginas y `login.html`, y falla si se vuelve a poner la hoja de Google Fonts en `index.html` (comprobado rompiendo) — cubre: CA7, CA8 — depende: T024, T025, T026, T027
  - nota: build en verde con `hostsProhibidos` activo en las seis páginas y `login.html`. Comprobado rompiendo: con la hoja de Google Fonts en `index.html` el build se detiene ("/: referencia fonts.googleapis.com", y así en cada página); restaurado, verde
- [x] T029 Servir `/login` prerenderizado, comprimir y cachear los assets en nginx — `frontend/nginx.conf` — hecho cuando: `node frontend/scripts/probar-nginx.mjs` pasa completo (T017) · comprobado rompiendo `gzip` — cubre: CA10 — depende: T017, T027
  - nota: `frontend/nginx.conf` es ruta protegida; se modifica con esta tarea aprobada
  - nota: `probar-nginx` pasa completo (29 comprobaciones) y `seo-rutas` (022) sigue 6/6: el login va en una `location ~ ^/login$` antes de la regla de privadas, en lugar de una `location =`, para no alterar la lista de páginas exactas. `gzip` con nivel 6 para texto, JS, CSS, JSON, XML y SVG; `/assets/` con `Cache-Control: public, max-age=31536000, immutable`. Comprobado rompiendo: con `gzip off` fallan las 5 comprobaciones de compresión; restaurado, pasan

### Añadidas durante /implement (decisión del usuario, 2026-11-17, tras la medición de T060)
- [x] T030 [P] Escribir la prueba del espacio reservado de la galería — `frontend/tests/galeria-estados.test.jsx` — hecho cuando: falla por la razón esperada y comprueba, con `usePublicData` simulado: cargando, error y vacía pintan la misma cuadrícula de 8 huecos (`.gallery-grid` con 8 hijos), invisible y `aria-hidden` en error y vacía, con el aviso correspondiente ("No pudimos cargar la galería" con "Reintentar", "Galería en preparación") dentro del mismo contenedor; y `Gallery.css` oculta la reserva con `visibility: hidden`; ejecutada dos veces — cubre: CA2, CA9
  - nota: añadida durante /implement: CLS 0,43 en `/galeria` en la medición (con la API caída el aviso de error es más bajo que el esqueleto)
  - nota: 3/4 fallan por la razón esperada en dos ejecuciones (en error y vacía no hay cuadrícula reservada; no existe `.gallery-estado__reserva`). El caso "cargando" pasa hoy: es el estado de referencia
- [x] T031 Reservar en la galería el alto del esqueleto en los avisos de error y de galería vacía — `frontend/src/pages/Gallery.jsx`, `frontend/src/styles/home/Gallery.css` — hecho cuando: T030 pasa (dos ejecuciones) · verificación manual: con la red y la CPU limitadas, `/galeria` sin backend no registra desplazamientos de más de 0,1 (script de `layout-shift`) — cubre: CA2, CA9 — depende: T030
  - nota: añadida durante /implement (decisión del usuario, 2026-11-17)
  - nota: T030 pasa (4/4, dos ejecuciones) con `prerender` e hidratación en verde. `AvisoConReserva` pinta los 8 huecos invisibles (`aria-hidden`, `visibility: hidden`) y el aviso encima, centrado
  - nota: verificación manual OK 2026-11-17 (Claude, Chrome sin cabeza con red y CPU limitadas, sin backend): en `/galeria` ya no se desplaza el pie; queda un desplazamiento de 0,023 a 412 px y 0,002 a 1440 px por el cambio de fuente (antes 0,11 + 0,023)
- [x] T032 [P] Escribir la prueba del botón de Google tras el pintado — `frontend/tests/rendimiento-carga.test.jsx` — hecho cuando: falla por la razón esperada y comprueba, con `@react-oauth/google` simulado y `requestIdleCallback` controlado: al montar el login no se monta `GoogleOAuthProvider` ni `GoogleLogin`; tras el evento `load` de la ventana y el callback de inactividad se montan; el contenedor `.google-btn` está desde el principio — cubre: CA1, CA5
  - nota: añadida durante /implement: `/login` 95 de 100; el script, el marco y la fuente del botón de Google (≈ 210 KB) compiten con el pintado
  - nota: los 2 casos nuevos fallan por la razón esperada en dos ejecuciones (Google se monta al instante; no se programa ningún callback de inactividad). El mock marca proveedor y botón con `data-prueba`; los 8 casos anteriores siguen en verde. jsdom ya está en `readyState complete`: el caso de `load` lo cubre la implementación y la verificación manual
- [x] T033 Cargar el botón de Google cuando la página ya está pintada — `frontend/src/pages/admin/login.jsx` — hecho cuando: T032 pasa (dos ejecuciones); T016, T012 y los tests del login siguen en verde; el proveedor envuelve solo al botón y se monta tras `load` + inactividad (con un límite de 2 s) · verificación manual: con la build local y Chrome sin cabeza, `/login` sigue pidiendo `gsi/client` y mostrando el botón — cubre: CA1, CA5 — depende: T032, T022
  - nota: añadida durante /implement (decisión del usuario, 2026-11-17)
  - nota: T032, T012, T016 y los tests del login pasan (81/81 con `seo-prerender`, dos ejecuciones). `useGoogleTrasPintar` espera a `load` (o lo da por hecho si `readyState` es `complete`) y a `requestIdleCallback` con límite de 2 s; el proveedor envuelve solo a `GoogleLogin` dentro de `.google-btn`, que se pinta desde el principio
  - nota: verificación manual OK 2026-11-17 (Claude, build local con client ID, Chrome sin cabeza): `/login` sigue pidiendo `/gsi/client`, `/gsi/style` y `/gsi/button` y monta el botón; las públicas no piden nada a Google
- [x] T034 Escribir la prueba de las precargas de la fuente y la foto principal — `frontend/tests/seo-prerender.test.jsx` — hecho cuando: falla por la razón esperada y comprueba que `construirPagina` y `paginaLogin` escriben en el `<head>`, antes de las hojas de estilo, cada precarga que reciben (`<link rel="preload" as="font" type="font/woff2" crossorigin>` y `<link rel="preload" as="image" fetchpriority="high">` con `imagesrcset` cuando lo hay), con los atributos escapados — cubre: CA1, CA2
  - nota: añadida durante /implement: portada 93 de 95 y nosotros 98 de 100 (retraso de pintado del LCP)
  - nota: los 3 casos nuevos fallan por la razón esperada en dos ejecuciones (`construirPagina` y `paginaLogin` ignoran `precargas`); los 59 anteriores siguen en verde
- [x] T035 Precargar la fuente del texto y la foto principal en las páginas generadas — `frontend/src/seo/cabecera.js`, `frontend/scripts/prerender.mjs` — hecho cuando: T034 pasa; el build escribe la precarga del `woff2` latino de Plus Jakarta Sans (del manifiesto) en las seis páginas, la del `woff2` latino de Jost en `login.html`, la de `/images/hero-dentissa.webp` en la portada y la de la foto de nosotros (con su `srcset`) en `/nosotros`; la guarda falla si falta la precarga de la fuente (comprobado rompiendo) — cubre: CA1, CA2 — depende: T034, T028
  - nota: añadida durante /implement (decisión del usuario, 2026-11-17)
  - nota: T034 pasa; suite del frontend 172/172 en dos ejecuciones. Las precargas van tras el `charset`: `woff2` latino de Plus Jakarta Sans en las seis páginas, el de Jost en `login.html`, y la foto principal tomada del propio HTML (el `<img>` con `fetchPriority="high"`: portada y nosotros con `imagesrcset`/`imagesizes`), sin duplicar datos de `site.js`. React 19 emite también precargas de imagen en el cuerpo; son las mismas URL y el navegador no las descarga dos veces
  - nota: comprobado rompiendo: sin la precarga de la fuente, el build se detiene ("/: sin la precarga de la fuente", etc.); restaurado, verde
  - nota: corrección tras medir: con las precargas antes de `<meta name="viewport">`, el navegador resolvía `imagesizes` con el ancho de escritorio por defecto y `/nosotros` descargaba dos fotos (1200 y 900; LCP 2,9 s). Ahora van tras el `viewport`; prueba nueva en `seo-prerender.test.jsx` (falla sin el arreglo, pasa con él). Comprobado en Chrome: una sola foto (900 px en móvil DPR 1,75; 600 px en escritorio)

### Correcciones de /review (ronda 1)
- [ ] T036 Escribir las pruebas del bloque del mapa corregido — `frontend/tests/rendimiento-estilos.test.js`, `frontend/tests/rendimiento-mapa.test.jsx` — hecho cuando: fallan por la razón esperada y comprueban: `.map iframe:focus-visible` dibuja el contorno hacia dentro (`outline-offset` negativo de al menos 2 px) (R1); `.map__llegar:hover` usa `var(--primary-700)` de texto y su contraste sobre blanco es ≥ 4,5:1 (R5); ninguna regla de `.map` en `Contact.css` lleva literales de longitud ni de `font-size` (salvo `0`, porcentajes y proporciones) (R2, R10); ninguna regla `.map.is-activo` cambia `aspect-ratio`, `height`, `min-height`, `max-height` ni `padding` (R31); con el mapa cargado, "Cómo llegar" no lleva `dt-btn--sm` (R4); ejecutadas dos veces — cubre: CA6
  - nota: añadida por /review: R1, R2, R4, R5, R10, R31
- [ ] T037 Añadir al sistema los tokens de espaciado y texto del bloque del mapa — `frontend/src/styles/home/global.css`, `docs/design/system.md`, `docs/specs/023-rendimiento-sitio/design.md` — hecho cuando: `:root` declara `--space-1` 6px, `--space-2` 10px, `--space-3` 12px, `--space-6` 24px, `--icono-lg` 52px y `--text-sm` 14px (modo `fijo`); `system.md` los recoge en "Espaciado, radios, bordes y sombras" y en "Tipografía", con su fila en Decisiones, y `design.md` en "Cambios a incorporar al sistema"; la suite sigue en verde — cubre: CA6 — depende: T036
  - nota: añadida por /review: R2 (decisión del usuario, 2026-11-17: añadir tokens)
- [ ] T038 Corregir el bloque del mapa: foco visible, tamaño y contraste de "Cómo llegar" y solo tokens — `frontend/src/pages/Contact.jsx`, `frontend/src/styles/home/Contact.css` — hecho cuando: T036 pasa (dos ejecuciones) y T011, T014 siguen en verde · verificación manual: con teclado, "Ver mapa" y Enter dejan el anillo de foco visible sobre el mapa; "Cómo llegar" mide ≥ 44 px en los dos estados a 390 y 1440 px (capturas medidas con Chrome sin cabeza) — cubre: CA6 — depende: T036, T037
  - nota: añadida por /review: R1, R2, R4, R5
- [ ] T039 [P] Escribir la prueba del aviso accesible de la galería — `frontend/tests/galeria-estados.test.jsx` — hecho cuando: falla por la razón esperada y comprueba: en error y vacía, el aviso está dentro de un elemento con `role="status"`; al pulsar "Reintentar", el foco pasa al título de la sección de la galería (`tabIndex=-1`) y no se queda en el `body` — cubre: CA9
  - nota: añadida por /review: R6
- [ ] T040 Anunciar el aviso de la galería y conservar el foco al reintentar — `frontend/src/pages/Gallery.jsx` — hecho cuando: T039 pasa (dos ejecuciones) y T030 sigue en verde — cubre: CA9 — depende: T039
  - nota: añadida por /review: R6
- [ ] T041 Escribir las pruebas del login y de `cargarPagina` corregidos — `frontend/tests/rendimiento-carga.test.jsx` — hecho cuando: fallan por la razón esperada y comprueban: el mock de `GoogleOAuthProvider` inserta un `<script src="https://accounts.google.com/gsi/client">` al montarse, y `/`, `/nosotros` y `/contacto` no lo tienen (R8); al desmontar el login, `document.title` vuelve a `TITULO_GENERAL` (R7); tras el pintado hay un solo proveedor montado, y al cambiar de "Iniciar sesión" a "Crear cuenta" se mantiene el mismo proveedor (sin volver a montarse) y se pinta el botón del panel activo (R9); con `sessionStorage` que lanza al leerse, `cargarPagina` resuelve una carga correcta (R11); tras recargar por un fallo y cargar bien, un fallo nuevo vuelve a recargar (R12); ejecutadas dos veces — cubre: CA4, CA5, CA9
  - nota: añadida por /review: R7, R8, R9, R11, R12
- [ ] T042 Un solo proveedor de Google en el login, título al salir y almacenamiento bloqueado — `frontend/src/pages/admin/login.jsx`, `frontend/src/App.jsx` — hecho cuando: T041 pasa (dos ejecuciones); T016, T032 y los tests del login siguen en verde; la limpieza de `useGoogleTrasPintar` cancela solo con la API que usó (R15) · verificación manual: con la build local, `/login` sigue pidiendo `gsi/client` una vez y muestra el botón en los dos paneles — cubre: CA4, CA5, CA9 — depende: T041
  - nota: añadida por /review: R7, R9, R11, R15
- [ ] T043 [P] Escribir la prueba de los tipos comprimidos de nginx — `frontend/tests/rendimiento-nginx.test.js` — hecho cuando: falla por la razón esperada y comprueba que `gzip_types` de `frontend/nginx.conf` incluye `text/javascript` y no incluye `application/json` — cubre: CA10
  - nota: añadida por /review: R20, R21
- [ ] T044 Ajustar los tipos comprimidos de nginx — `frontend/nginx.conf` — hecho cuando: T043 pasa y `node frontend/scripts/probar-nginx.mjs` sigue en 29/29 — cubre: CA10 — depende: T043
  - nota: añadida por /review: R20, R21 (ruta protegida, tarea aprobada por el usuario en /review)
- [ ] T045 Reforzar las guardas del build: foto principal, login sin Open Graph y mensaje sin datos — `frontend/scripts/prerender.mjs` — hecho cuando: el build falla si `/` o `/nosotros` no llevan la precarga de su foto principal (R16) o si `login.html` lleva `property="og:` (R17), y el error de `datosDeSesion` muestra solo el tipo (JWT, token o correo), no el dato (R22) · comprobado rompiendo cada regla — cubre: CA2, CA5 — depende: T042
  - nota: añadida por /review: R16, R17, R22
- [ ] T046 Poner al día la documentación de SEO y del plan — `docs/seo.md`, `docs/specs/023-rendimiento-sitio/plan.md`, `docs/specs/023-rendimiento-sitio/tasks.md` — hecho cuando: las "Reglas del sitio", el inventario y la exclusión de privadas de `seo.md` describen el estado tras 022 y 023 (R18); `plan.md` ya no dice "sin `preload` adicional" (R19) y TM1 se mapea a A02:2025 con el texto de lo que la guarda controla (R23); T001 cita `backend/tests/seguridad/dependencias-produccion.json` (R35)
  - nota: añadida por /review: R18, R19, R23, R35
- [ ] T047 Registrar la excepción de picomatch — `docs/security.md` — hecho cuando: "Excepciones aceptadas" tiene la fila de GHSA-fc5q-39xc-vjpf (picomatch ≤ 4.0.7, alta en origen, real baja: solo desarrollo y build), motivo, "aprobada por el usuario 2026-11-17", vence 2027-01-31 o al publicarse picomatch ≥ 4.0.8; y el job de seguridad del CI se rehace con esa excepción documentada — cubre: —
  - nota: añadida por /review: R3 (decisión del usuario, 2026-11-17)

## Integración y documentación
- [x] T060 Verificar el sitio completo — sin archivos — hecho cuando: `npm test` en verde; lint sin errores nuevos en los archivos tocados; `npm run build` correcto; `npm audit --audit-level=high` sin altas ni críticas · verificación manual: `medir-rendimiento.mjs` con mediana de 3 por ruta cumple CA1 (100 en nosotros, galería, aviso, términos y login; ≥ 95 en portada y contacto) y CA2 (LCP ≤ 2,5 s, CLS ≤ 0,1), SEO 100 y Accesibilidad no menor que la línea base (T002); capturas `despues` (T003) iguales a las de `antes` salvo el mapa, revisadas por el usuario (CA9); login, panel y portal funcionan al recargar y al entrar desde el login — cubre: CA1, CA2, CA9 — depende: T021, T022, T023, T024, T025, T026, T027, T028, T029, T031, T033, T035
  - nota: suite completa en verde en dos ejecuciones (backend 256 + 5 `todo`; frontend 172 + 1 tras T035); lint del frontend 12 problemas (13 previos, ninguno nuevo); build con todas las guardas; `npm audit`: 0 vulnerabilidades; `probar-nginx` 29/29
  - nota: medición final (Lighthouse 13.6.0 móvil, mediana de 5, imagen con client ID y backend ficticio, contenedores locales parados; `.ai/inspect/023-medicion-final3` y `-final2`). Se descartaron las mediciones con `benchmarkIndex` ≈ 1.000 (equipo saturado): `/galeria` 100 · `/contacto` 100 · `/aviso-de-privacidad` 100 · `/terminos-de-servicio` 100 · `/login` 99 (98/99/99/98/99), LCP 2,1 s · `/nosotros` 97 (corridas válidas 97/97/97/96), LCP 2,5–2,6 s · `/` 97 en `final2` (92/97/97/96/98, índice 1.900–2.600), LCP 2,4–2,5 s; en `final3` 89 con índice 1.350–1.750. CLS ≤ 0,005 en las siete; SEO 100 en las públicas (`/login` 66 por su `noindex`); Accesibilidad igual que la línea base
  - nota: frente a las metas de CA1/CA2: cumplen galería, contacto, aviso y términos (100) y portada (≥ 95). No llegan: `/login` 99 de 100 (variación de 98–99: se decide en `/review`, supuesto de la spec) y `/nosotros` 97 de 100 con LCP 2,5–2,6 s (límite de 2,5 s). Línea base: 78, 75, 99, 96, 70*, 98, 84 (*ruido)
  - nota: capturas `despues` en `.ai/inspect/023-despues/` y comparación lado a lado en `.ai/inspect/023-comparacion/`: iguales salvo el bloque del mapa (contacto), la galería (reserva el alto del esqueleto) y la portada a 390 px, donde en `antes` el logo y la foto aún no habían cargado al capturar
  - nota: verificación manual OK 2026-11-17 (usuario): login con su backend local, panel y portal, comparación de capturas y Lighthouse revisados. Acepta `/login` en 99 y `/nosotros` en 97 (decisión del usuario, 2026-11-17: "no es importante el login en 99 [...] más de 95 en su mayoría")
- [x] T090 Actualizar `docs/architecture.md` (login prerenderizado, guardas, división de código de las rutas privadas, compresión y caché en nginx; sustituir la línea de Google Fonts y Unsplash) y `docs/seo.md` (regla de Renderizado y fila `/login` del inventario)
  - nota: `architecture.md` (resumen: `login.html`, carga bajo demanda, guardas, compresión y caché; fila "SEO y prerender"; Google Sign-In solo en el login; Google Maps bajo demanda en lugar de "Google Fonts e imágenes de Unsplash") y `seo.md` (regla de Renderizado y fila `/login`)
- [x] T091 Actualizar `docs/deployment.md` y `docs/observability.md` si cambiaron variables, entornos, pasos de deploy, logs, eventos de auditoría o métricas
  - nota: sin cambios: el frontend se reconstruye como siempre; `VITE_GOOGLE_CLIENT_ID` ya llega al build por el `/fix` del Dockerfile (PR #78), sin variables, logs ni métricas nuevos
- [ ] T092 Marcar spec como `implemented`

## Despliegue (lo ejecuta `/release`)
- [ ] T095 Desplegar a staging y verificar criterios de aceptación
  - nota: no hay staging (`docs/deployment.md`); las verificaciones se hacen con el contenedor local (T060)
- [ ] T096 Aprobación humana para producción
- [ ] T097 Desplegar a producción y vigilar métricas del plan (Rollout)
  - Lighthouse en producción en las siete rutas (usuario); entrar con Google de verdad (usuario, CA5); panel y portal al recargar
- [ ] T098 Marcar spec como `released`

## Cobertura
| Criterio | Tarea(s) de test | Tarea(s) de implementación |
|---|---|---|
| CA1 | T002, T032, T034, T060 | T021, T022, T023, T024, T025, T026, T027, T028, T029, T033, T035 |
| CA2 | T002, T015, T030, T034, T060 | T023, T025, T027, T031, T035, T045 |
| CA3 | T015, T018 | T023 |
| CA4 | T012, T013, T041 | T020, T021, T042 |
| CA5 | T012, T016, T032, T041 | T022, T027, T033, T042, T045 |
| CA6 | T011, T014, T015, T036 | T026, T037, T038 |
| CA7 | T010, T013, T015 | T020, T025, T028 |
| CA8 | T010, T013, T015 | T020, T024, T028 |
| CA9 | T003, T016, T030, T039, T041, T060 | T027, T031, T040, T042 |
| CA10 | T017, T043 | T029, T044 |

| Amenaza (TM#) | Tarea(s) de control | Tarea(s) de test |
|---|---|---|
| TM1 | T020, T027 | T013, T015 |

| Cambio del plan (módulo) | Tarea(s) |
|---|---|
| `frontend/package.json`, `package-lock.json` | T001 |
| `frontend/scripts/medir-rendimiento.mjs` | T002 |
| `frontend/scripts/capturas.mjs` | T003 |
| `frontend/src/seo/guardas.js` | T013, T020 |
| `frontend/src/App.jsx` | T021 |
| `frontend/src/seo/rutas.js` | T015, T021, T027 |
| `frontend/src/main.jsx`, `pages/admin/login.jsx`, `tests/login-redireccion.test.jsx` | T022, T024 |
| `frontend/src/components/home/SmartImage.jsx`, `styles/home/global.css` | T023, T024 |
| `frontend/index.html` | T024 |
| `frontend/public/images/`, `src/data/site.js`, `pages/About.jsx` | T025 |
| `frontend/src/pages/Contact.jsx`, `styles/home/Contact.css` | T026 |
| `frontend/src/seo/cabecera.js` | T015, T027 |
| `frontend/scripts/prerender.mjs` | T021, T027, T028 |
| `frontend/nginx.conf` | T029, T044 |
| `frontend/src/pages/Gallery.jsx`, `styles/home/Gallery.css` | T031 |
| `frontend/scripts/probar-nginx.mjs` | T017 |
| `frontend/tests/` | T010, T011, T012, T013, T014, T015, T016, T018, T030, T032, T034 |
| `docs/architecture.md`, `docs/seo.md` | T090, T046 |
| `docs/design/system.md`, `global.css` (tokens) | T037 |
| `docs/security.md` (excepción) | T047 |

| Requisito no funcional | Tarea(s) de test o verificación manual (T095) |
|---|---|
| Rendimiento (CA1, CA2) | T002 (línea base), T060 |
| Rendimiento en producción | T097 (usuario) |
| Descubribilidad sin cambios | T015, T060 (SEO 100) |
| Accesibilidad del bloque del mapa | T011, T014, T026 |
