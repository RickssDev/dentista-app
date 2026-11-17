---
spec: 023-rendimiento-sitio
status: approved   # draft | approved | blocked
constitution_version: 1.0.0
created: 2026-11-17
---

# Plan · 023 Rendimiento del sitio público y el login

## Enfoque técnico
Que cada página llegue pintada y descargue solo lo suyo:
- **División de código:** el login, el panel, el portal y restablecer contraseña pasan a `lazy()`
  con su propio `Suspense`, así que su JavaScript y su CSS salen del archivo principal.
- **Google solo en el login:** el inicio de sesión con Google se monta dentro de `login.jsx`.
- **Login prerenderizado:** se genera como `login.html` con el mecanismo del ADR 0009.
- **Foto principal sin esperas:** `SmartImage` con `priority` ya no oculta la imagen y acepta
  `srcSet`.
- **Nada externo al cargar:** la fuente se sirve desde el sitio, la foto de Unsplash de nosotros
  pasa a WebP local y el mapa se carga bajo demanda.

nginx comprime el texto y guarda en caché, durante un año, los archivos con huella. Las
comprobaciones de la build viven en funciones puras (`src/seo/guardas.js`) probadas con Vitest.
Cada una se activa en el build en la tarea que la hace pasar, así que el build sigue en verde en
cada commit. Un script local mide Lighthouse con la mediana de 3 corridas.

## Constitution Check
| Principio | Resultado | Justificación / ajuste | Cómo se verifica |
|---|---|---|---|
| P1 Spec antes de implementar | ✅ | Spec 023 y `design.md` aprobados (tras `/analyze`) | manual: `aidd.py validate` |
| P2 Tests por feature | ✅ | Cada CA con test o guarda; CA1/CA2 con el script de medición | test: `frontend/tests/rendimiento-*.test.js(x)`, `seo-*.test.js(x)`, `probar-nginx.mjs`; manual: `scripts/medir-rendimiento.mjs` |
| P3 Dependencias nuevas con ADR | ✅ | `@fontsource-variable/plus-jakarta-sans`, verificada | manual: ADR 0010 |
| P4 Arquitectura con ADR | ✅ | Login prerenderizado, división de código del enrutado y guardas del build | manual: ADR 0010 y T090 |
| P5 Producción solo con aprobación humana | ✅ | Se libera con `/release` | manual: puerta de `/release` |
| P6 Rollback documentado | ✅ | Ver Rollout; sin datos | manual: Rollout |
| P7 Migraciones compatibles | ➖ | Sin esquema | — |
| P8 Autorización en el servidor | ➖ | Sin endpoints; las rutas privadas siguen protegidas por la API | — |
| P9 Entrada validada y SQL parametrizado | ➖ | Sin entradas nuevas | — |
| P10 Secretos fuera del repositorio | ✅ | El login prerenderizado solo usa `VITE_GOOGLE_CLIENT_ID`, público; los scripts lo leen de `frontend/.env` sin mostrarlo | test: gitleaks en CI; guarda TM1 |
| P11 Sin vulnerabilidades críticas o altas | ✅ | Línea base 2026-11-17: frontend sin vulnerabilidades; backend 1 baja y 20 moderadas | test: `npm audit --audit-level=high` en CI y `/release` |
| P12 Modelo de amenazas | ✅ | TM1 (login prerenderizado sin datos de sesión) con control y test | test: `rendimiento-guardas.test.js` (TM1) y la guarda del build |
| P13 Auditoría de datos sensibles | ➖ | No toca datos sensibles ni permisos | — |
| P14 Correlación por petición | ➖ | Sin logs ni peticiones nuevas a la API | — |
| P15 Logs sin datos sensibles | ➖ | Sin logs | — |
| P16 Accesibilidad WCAG 2.1 AA | ✅ | "Ver mapa" con fondo `--primary-700` (5,48:1); "Cómo llegar" con borde `--muted` (4,76:1); teclado y foco al mapa; título propio en `/login`; sin cambios visuales en el resto | test: `rendimiento-mapa.test.jsx` (teclado, foco y tamaño), `rendimiento-estilos.test.js` (contraste de texto ≥ 4,5:1 y de borde y anillo de foco ≥ 3:1) y `rendimiento-carga.test.jsx` (título del login); manual: Lighthouse Accesibilidad no baja |
| P17 Sin lógica de negocio en las vistas | ✅ | Imágenes en `src/data/site.js`, títulos y comprobaciones en `src/seo/` | manual: `/review` |
| P18 Metadatos por ruta indexable | ✅ | Sin cambios en las seis rutas públicas | test: `seo-prerender.test.jsx` sigue en verde |
| P19 Noindex fuera de lo público | ✅ | `login.html` con `noindex`, sin canónica ni Open Graph, fuera del sitemap; `X-Robots-Tag` en `/login` | test: `seo-prerender.test.jsx` (login), `seo-archivos.test.js`, `probar-nginx.mjs` |
| P20 La interfaz usa solo el sistema de diseño | ✅ | El bloque del mapa usa `.map`, `.dt-btn` y tokens existentes | test: `rendimiento-estilos.test.js` (sin colores literales en las reglas nuevas del bloque) |

## Cambios por módulo
| Módulo | Cambio | Riesgo |
|---|---|---|
| `frontend/src/App.jsx` | `Login`, `AdminPanel`, `InicioPaciente`, `CitasPaciente`, `PerfilPaciente`, `CompletarPerfil` y `RestablecerContrasena` con `lazy()` a través de `cargarPagina(importar)`: si el `import()` falla (chunk de una versión anterior tras un despliegue), recarga la página una sola vez (marca en `sessionStorage`). Cada ruta privada se envuelve en `<Suspense fallback={<p>Cargando página...</p>}>`. `Home` y `Layout` siguen estáticos | medio: hidratación del login prerenderizado (T016) y chunks viejos tras un despliegue (mitigado con la recarga) |
| `frontend/src/main.jsx` | Quita `GoogleOAuthProvider`; importa `@fontsource-variable/plus-jakarta-sans` | bajo |
| `frontend/src/pages/admin/login.jsx`, `frontend/tests/login-redireccion.test.jsx` | El login envuelve su contenido en `GoogleOAuthProvider` (`VITE_GOOGLE_CLIENT_ID`) y pone `document.title = TITULO_LOGIN` al montarse; el mock del test añade un `GoogleOAuthProvider` que solo pinta a sus hijos | medio: inicio de sesión con Google |
| `frontend/src/components/home/SmartImage.jsx`, `frontend/src/styles/home/global.css` | Con `priority`, la imagen se pinta desde el primer render (clase `is-priority`: sin `opacity: 0` ni esqueleto); nueva prop `srcSet`. El resto, igual | bajo |
| `frontend/src/styles/home/global.css`, `frontend/index.html`, `frontend/src/main.jsx` | `--font` pasa a `"Plus Jakarta Sans Variable"` con la misma reserva. Sin `preconnect` a Google Fonts y Unsplash, sin la hoja de Google Fonts y sin `<link rel="icon" type="image/jpeg">` | bajo |
| `frontend/src/data/site.js` | `IMAGES.about` local (`/images/nosotros-900.webp`) con `IMAGES.aboutSrcSet`; se elimina `IMAGES.contact`, sin uso | bajo |
| `frontend/public/images/` | `nosotros-{600,900,1200}.webp` (generado por descarga de Unsplash con `fm=webp&w=N&q=70`) | bajo |
| `frontend/src/pages/About.jsx` | La foto principal con `priority`, `srcSet` y `sizes` | bajo |
| `frontend/src/pages/Contact.jsx`, `frontend/src/styles/home/Contact.css` | Bloque del mapa según `design.md`: vista previa en `.map` con fondo `--tint` sin brillo animado; enlace "Ver mapa" (`mapLink`, fondo `--primary-700`) que con JavaScript monta el `iframe` en el mismo `.map` y le pasa el foco; "Cómo llegar" `ghost` con borde `--muted` en los dos estados | medio: foco y tamaño |
| `frontend/src/seo/guardas.js` (nuevo) | Funciones puras sobre el manifiesto de Vite y el HTML: `hostsProhibidos(html)`, `modulosPrivadosEnEntrada(manifiesto, modulos)` (cada módulo es `isDynamicEntry` y su chunk no está en el cierre de `imports` de `index.html`) y `datosDeSesion(html)` (TM1: busca JWT, `"token"` y correos en el texto y en los atributos `value`, sin contar los `placeholder`) | bajo |
| `frontend/src/seo/rutas.js`, `frontend/src/seo/cabecera.js` | `TITULO_LOGIN` y `MODULOS_PRIVADOS` en `rutas.js`; `paginaLogin(plantilla, { cuerpo, css })` en `cabecera.js`, que usan el prerender y el test | bajo |
| `frontend/scripts/prerender.mjs` | Llama a las guardas activas; genera `dist/login.html` con `paginaLogin`. Cada regla se activa en la tarea que la hace pasar: módulos privados en T021, `login.html` y TM1 en T027, hosts prohibidos (siete páginas) en T028 | medio |
| `frontend/nginx.conf` | `location = /login` → `login.html` con `X-Robots-Tag: noindex`; `gzip` para HTML, JS, CSS, JSON, XML, SVG y texto (`gzip_min_length` por defecto); `Cache-Control: public, max-age=31536000, immutable` en `/assets/` | medio: ruta protegida (tarea aprobada) |
| `frontend/scripts/probar-nginx.mjs` | Comprueba `/login` prerenderizado con `noindex`, `Content-Encoding: gzip` en HTML, JS, CSS, `sitemap.xml` y `robots.txt`, y la caché de `/assets/` | bajo |
| `frontend/scripts/medir-rendimiento.mjs` (nuevo) | Construye la imagen con `--build-arg VITE_GOOGLE_CLIENT_ID` leído de `frontend/.env` (sin mostrarlo) y la levanta con backend ficticio. Pasa Lighthouse 13.6.0 con `npx`, móvil, 3 veces por cada una de las siete rutas, y escribe la mediana de Rendimiento, LCP, CLS, SEO y Accesibilidad. No corre en CI | bajo |
| `frontend/scripts/capturas.mjs` (nuevo) | Abre Chrome sin cabeza con `--remote-debugging-port` y, con el WebSocket de Node 22 y el protocolo de DevTools, hace capturas de página completa (`Page.captureScreenshot` con `captureBeyondViewport`) a 390 y 1440 px de las siete rutas | bajo |
| `frontend/package.json`, `package-lock.json` | `@fontsource-variable/plus-jakarta-sans@5.3.0` | bajo |
| `frontend/tests/` | `rendimiento-carga.test.jsx`, `rendimiento-mapa.test.jsx`, `rendimiento-recursos.test.js`, `rendimiento-guardas.test.js`, `rendimiento-estilos.test.js`, `smartimage-prioridad.test.jsx`; casos nuevos en `seo-prerender.test.jsx`, `seo-hidratacion.test.jsx` y `tests/support/prerenderizar.mjs` | bajo |

Requisito previo: la ficha `2026-11-17-fix-dockerfile-google-client-id` (PR #78) fusionada antes de
T002, para que el build de Docker reciba el client ID (`/analyze` A8).

## Contratos y datos
Sin cambios de API ni de datos.

| Pantalla | Estados | Accesibilidad medible |
|---|---|---|
| `/contacto` · bloque del mapa | Vista previa (por defecto, también sin JavaScript); cargado | "Ver mapa" (enlace) se alcanza con Tab y se activa con Enter; tras activarlo, el foco está en el `iframe` "Ubicación de Dentissa en Google Maps"; objetivo ≥ 44 px (`.dt-btn`, 46 px); texto blanco sobre `--primary-700` 5,48:1; foco visible con el anillo de `.dt-btn:focus-visible` |
| `/login` | Llega prerenderizado; se hidrata | El orden de tabulación y los mensajes no cambian (tests existentes del login) |

Hosts prohibidos en las siete páginas al cargar: `fonts.googleapis.com`, `fonts.gstatic.com`,
`images.unsplash.com`, `accounts.google.com`, `maps.google.com` y `maps.googleapis.com`. En el login,
la librería añade `accounts.google.com` al montar el botón, después del render, y su
marco carga sus propios recursos (fuente incluida): no están en `login.html`, y CA5 y CA8 lo
permiten ahí.

## Estrategia de pruebas
Vitest, del proyecto:
- **Funciones de la guarda** (`rendimiento-guardas.test.js`, node). Se prueban sobre manifiestos y
  HTML de ejemplo:
  - detectan cada host prohibido;
  - detectan un módulo privado incrustado o importado de forma estática desde la entrada;
  - detectan un token tipo JWT, un `"token"` o un correo en el texto o en un `value` (TM1); un HTML
    con `placeholder="tu@correo.com"`, como el login real, es limpio.

  Cada regla se comprueba rompiéndola.
- **HTML generado** (`seo-prerender.test.jsx`, node). La tarea de test crea `TITULO_LOGIN` y una
  firma de `paginaLogin` que lanza "sin implementar"; las llamadas van dentro de cada `test`, para no
  romper los casos de la 022:
  - las seis páginas y `paginaLogin(...)` sin hosts prohibidos (con la función de la guarda);
  - portada con `is-priority` y sin `is-loading`;
  - nosotros con `eager` y `srcset` local;
  - contacto sin `iframe` y con "Ver mapa";
  - `paginaLogin` con `noindex`, título y formulario, sin canónica, Open Graph ni JSON-LD, y sin
    datos de sesión.
- **jsdom:**
  - `rendimiento-carga.test.jsx`: `/`, `/nosotros` y `/contacto` montados con `AppRoutes` no
    insertan scripts de Google; `main.jsx` no usa `GoogleOAuthProvider` y `login.jsx` sí. Montar
    `AppRoutes` sin proveedor pasa hoy; la parte que falla antes del cambio es la del código fuente
    (A15). También: el login montado pone "Iniciar sesión | Dentissa", y `cargarPagina` recarga una
    sola vez si el `import()` falla.
  - `smartimage-prioridad.test.jsx`: con `priority`, `SmartImage` mantiene `is-priority` y no pasa a
    `is-loading` al montar ni tras `load`; el CSS de `.is-priority img` no aplica `opacity: 0` (CA3).
  - `rendimiento-mapa.test.jsx`: estado inicial, clic y Enter, foco al `iframe`, "Cómo llegar"
    presente, y el `.map` con las mismas clases y estilos de tamaño antes y después (K2).
  - Los tests del login siguen en verde con el proveedor simulado.
- **Estilos** (`rendimiento-estilos.test.js`, node):
  - contraste ≥ 4,5:1 de los textos del bloque, calculado con los valores de los tokens en
    `global.css`: `--ink` sobre `--tint`, `--muted` sobre `--tint`, blanco sobre `--primary-700` y
    `--ink` sobre blanco;
  - contraste ≥ 3:1 del borde de "Cómo llegar" (`--muted` sobre blanco) y del anillo de foco global
    (`--primary-600` sobre `--tint`), y la regla global `:focus-visible` con contorno ≥ 2 px;
  - el estado inicial de `.map` usa `var(--tint)` sin animación, y ninguna regla nueva o modificada
    de `.map` en `Contact.css` usa colores literales.
- **Hidratación:** `seo-hidratacion.test.jsx` añade `/login`. Hoy falla porque `GoogleLogin` no
  tiene proveedor dentro de `AppRoutes`.
- **Recursos** (`rendimiento-recursos.test.js`):
  - `index.html` sin Google Fonts, sin Unsplash y sin el ícono JPEG;
  - las tres variantes WebP de nosotros existen con su ancho;
  - `site.js` sin URLs externas en `IMAGES`;
  - `global.css` declara "Plus Jakarta Sans Variable";
  - `main.jsx` importa la fuente;
  - el CSS del paquete de la fuente usa `font-display: swap`.
- **nginx** (`probar-nginx.mjs`, en CI): `/login`, gzip (con `sitemap.xml` y `robots.txt`) y la caché
  de assets.
- **En rojo hasta su tarea:** los tests nuevos se confirman fallando por la razón esperada y quedan
  así hasta la tarea que los hace pasar, como en la 022. `probar-nginx` (CI) queda en rojo desde
  T017 hasta T029, y el PR se abre al final. El build sí queda en verde en cada commit.
- **Rendimiento** (CA1, CA2): `scripts/medir-rendimiento.mjs` a mano, al cerrar cada bloque y en
  T060. No va en CI.
- **Visual** (CA9, K3): `scripts/capturas.mjs` antes (T003) y después (T060), revisadas por el
  usuario.

## Modelo de amenazas
| ID | Amenaza (STRIDE) | Categoría OWASP | Componente | Control | Test |
|---|---|---|---|---|---|
| TM1 | Divulgación de información: que `login.html`, generado en el build y servido a cualquiera, contenga un token, datos de un usuario o valores del entorno de build que no son públicos | A05:2021 Configuración de seguridad incorrecta | `scripts/prerender.mjs`, `login.jsx` | El login solo lee `localStorage` en efectos y manejadores; la guarda `datosDeSesion` hace fallar el build si `login.html` contiene un JWT (`eyJ…`), un `"token"` o una dirección de correo en el texto o en un `value` (los `placeholder` no cuentan) | `rendimiento-guardas.test.js` (TM1, comprobado rompiendo); `seo-prerender.test.jsx` (login sin datos de sesión) |

No hay más entradas ni datos nuevos. El mapa de Google se carga solo a petición, con el mismo
`iframe` y `referrerPolicy` de hoy.

## Trazabilidad
| Criterio de aceptación | Cambio(s) | Test(s) |
|---|---|---|
| CA1: Rendimiento 100 / ≥ 95 | todos | `scripts/medir-rendimiento.mjs`, mediana de 3 · verificación manual: tabla por ruta contra las metas de la spec (T060) |
| CA2: LCP ≤ 2,5 s, CLS ≤ 0,1 | `SmartImage`, `About.jsx`, login prerenderizado | `medir-rendimiento.mjs` · verificación manual: LCP y CLS por ruta (T060) |
| CA3: foto de portada sin esperar a JS | `SmartImage.jsx`, `global.css` | `seo-prerender.test.jsx` (portada `is-priority`, sin `is-loading`); `smartimage-prioridad.test.jsx` (sigue visible tras montar y tras `load`); `seo-hidratacion` · verificación manual: la portada sin JavaScript muestra la foto |
| CA4: sin código del panel y el portal | `App.jsx` | `rendimiento-guardas.test.js` (`modulosPrivadosEnEntrada`) y la guarda activa en el build desde T021; `rendimiento-carga.test.jsx` (`cargarPagina` recarga una vez); tests del panel y el portal en verde · verificación manual: navegar del login al panel y al portal |
| CA5: Google solo en el login | `main.jsx`, `login.jsx` | `rendimiento-carga.test.jsx`; `seo-hidratacion` (login); tests del login · verificación manual: con Chrome sin cabeza, `/login` pide `gsi/client` y las públicas no (T022); entrar con Google en producción (T097) |
| CA6: mapa bajo demanda | `Contact.jsx`, `Contact.css` | `rendimiento-mapa.test.jsx`; `seo-prerender.test.jsx` (sin `iframe`) · verificación manual: a 390 y 1440 px contra `design.md` |
| CA7: foto de nosotros propia, sin URL externas | `site.js`, `public/images/`, `About.jsx`, `SmartImage.jsx` | `rendimiento-recursos.test.js`; `seo-prerender.test.jsx` (nosotros `eager` con `srcset` local); guarda de hosts |
| CA8: sin fuentes externas, misma tipografía | `index.html`, `main.jsx`, `global.css`, `package.json` | `rendimiento-recursos.test.js` (incluye `font-display: swap`); guarda de hosts · verificación manual: capturas |
| CA9: todo igual, SEO 100, accesibilidad, hidratación | todos | `seo-*.test.js(x)` y `seo-hidratacion`; `medir-rendimiento.mjs` (SEO 100, Accesibilidad no baja) · verificación manual: capturas a 390 y 1440 px |
| CA10: compresión y caché | `nginx.conf` | `probar-nginx.mjs`: gzip en HTML, JS, CSS, `sitemap.xml` y `robots.txt`; `Cache-Control` de `/assets/` |
| TM1: login sin datos de sesión | `guardas.js`, `prerender.mjs` | `rendimiento-guardas.test.js`; `seo-prerender.test.jsx` |
| RNF: accesibilidad del bloque del mapa | `Contact.jsx`, `Contact.css` | `rendimiento-mapa.test.jsx`, `rendimiento-estilos.test.js` |
| RNF: producción tras Cloudflare | — | verificación manual: Lighthouse en producción al liberar (T097) |

## Observabilidad
No aplica: no toca datos sensibles, autenticación en el servidor ni permisos, y no añade logs.
Tras el deploy se verifica con Lighthouse en producción.

## Descubribilidad
| Ruta | Indexable | Título | Descripción | Canónica | Sitemap | Datos estructurados | Test |
|---|---|---|---|---|---|---|---|
| `/login` | no (inicio de sesión) | "Iniciar sesión \| Dentissa" | — | no | no | — | `seo-prerender.test.jsx` (login), `seo-archivos.test.js`, `probar-nginx.mjs` |
| `/`, `/nosotros`, `/galeria`, `/contacto`, `/aviso-de-privacidad`, `/terminos-de-servicio` | sí, sin cambios | sin cambios | sin cambios | sin cambios | sí | portada: `Dentist` | tests de la 022 en verde |

- Renderizado: `/login` pasa a prerenderizado; el resto de rutas privadas sigue con `app.html`
  (ADR 0010; cambia la 022, `extends`).
- Imagen para compartir: sin cambios.
- Brechas `SE`: ninguna nueva.

## Rollout
- Feature flag: no aplica. El cambio es de entrega, no de flujo, y se revierte reconstruyendo.
- Orden de despliegue: primero el `/fix` del Dockerfile (PR #78), después esta spec. Solo el
  frontend: `docker compose … build frontend && up -d frontend`, conservando los ajustes locales
  del compose del servidor.
- Compatibilidad: los nombres con huella cambian. Un navegador con la versión anterior abierta
  que navega al login, al panel o al portal pide un chunk que ya no existe: `cargarPagina` recarga la
  página una vez y toma la versión nueva. Se comprueba a mano tras el despliegue (T097).
- Rollback: en el servidor, `git checkout <commit anterior>` y reconstruir el frontend. Sin datos.
- Métricas a vigilar: Lighthouse en producción en las siete rutas; el login con Google; el panel y
  el portal al recargar y al entrar desde el login.

## Decisiones (→ ADR si son arquitectónicas)
- **Fuente** → ADR 0010: `@fontsource-variable/plus-jakarta-sans`, como Jost.
- **Login prerenderizado** → ADR 0010 (decisión del usuario, 2026-11-17).
- **División de código:** `lazy()` por ruta privada, cada una con su `Suspense` y el respaldo de
  las públicas. `Home` estático.
- **Guarda del build en funciones puras** (`src/seo/guardas.js`), probadas con Vitest. Cada regla
  se activa en el build en la tarea que la hace pasar, para que cada commit deje el build en verde
  y se pueda medir entre bloques (`/analyze` A3).
- **Foto principal:** `SmartImage` con `priority` no oculta la imagen; sin `preload` adicional.
- **Fotos:** solo la de nosotros se aloja (WebP a 600, 900 y 1200 px); `IMAGES.contact` no se usa y
  se elimina (`/analyze` A7).
- **Mapa:** enlace `mapLink` que, con JavaScript, monta el `iframe` en el mismo `.map`; fondo
  `--primary-700` en "Ver mapa" (decisión del usuario, 2026-11-17, `/analyze` A1).
- **Client ID en local:** el `/fix` del Dockerfile (decisión del usuario, 2026-11-17). Los scripts
  pasan el valor de `frontend/.env` como `--build-arg` sin escribirlo en ningún sitio.
- **Medición:** script propio con Lighthouse por `npx`, contra la imagen con backend ficticio;
  supuestos confirmados por el usuario (`/analyze` A22).
- **Capturas:** protocolo de DevTools desde Node 22 (WebSocket nativo), sin Playwright.
- **Compresión:** `gzip` en nginx, `robots.txt` incluido. Sin `brotli`: la imagen oficial no trae el
  módulo.
- **Título del login:** "Iniciar sesión | Dentissa" al cargar (`login.html`) y al llegar navegando
  (efecto del login) (decisión del usuario, 2026-11-17, `/analyze` A40).
- **"Cómo llegar":** `ghost` con borde `--muted` en los dos estados del bloque (decisión del
  usuario, 2026-11-17, `/analyze` A28).
- **Fuera:** la caché de Cloudflare de `robots.txt` y `sitemap.xml` (su `/fix`).

## Impacto en arquitectura
- `docs/architecture.md`, módulo "SEO y prerender": `login.html`, las guardas y la división de
  código de las rutas privadas. Se sustituye la línea "Google Fonts e imágenes de Unsplash
  cargadas desde el navegador".
- Fila de nginx: compresión y caché de `/assets/`.
- `docs/seo.md`: la regla de Renderizado y la fila de `/login` del inventario (prerenderizada con
  `noindex`).

## Riesgos y mitigaciones
- **Conflicto con la rama de la maqueta:** `feat/maqueta-iot` cambia `frontend/package.json` y
  `package-lock.json` (`qrcode.react`) y páginas del paciente. Mitigación: esta spec solo cambia
  los `import` de `App.jsx` y añade una dependencia. Quien se fusione después resuelve el lockfile
  con `npm install` y vuelve a pasar la suite.
- **Login a 100 con el script de Google:** el botón carga `accounts.google.com/gsi/client` después
  del render, y puede costar puntos. Mitigación: se mide con el client ID (A8). Si no llega, se
  decide en `/review` con las tres corridas, sin cambiar la meta de la spec.
- **Login prerenderizado y Google:** si el HTML del servidor y el del cliente difieren, falla la
  hidratación. Mitigación: `/login` en `seo-hidratacion.test.jsx` con `onRecoverableError`
  estricto.
- **La portada no llega a 95:** se mide al cerrar cada bloque con `medir-rendimiento.mjs`.
- **Ruido de Lighthouse en las metas de 100:** mediana de 3; si una queda en 98–99 solo por
  variación, se decide en `/review` (supuesto confirmado).
- **Tipografía:** la variable puede diferir mínimamente de la estática de Google. Mitigación:
  capturas antes y después (CA9).
