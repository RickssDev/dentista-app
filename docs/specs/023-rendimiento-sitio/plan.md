---
spec: 023-rendimiento-sitio
status: draft   # draft | approved | blocked
constitution_version: 1.0.0
created: 2026-11-17
---

# Plan · 023 Rendimiento del sitio público y el login

## Enfoque técnico
Que cada página llegue pintada y descargue solo lo suyo. Cinco ideas:
1. **División de código:** el login, el panel, el portal y restablecer contraseña pasan a
   `lazy()`, así que su JavaScript y su CSS salen del archivo principal.
2. **Google solo en el login:** el inicio de sesión con Google se monta dentro de `login.jsx`, no
   en toda la app.
3. **Login prerenderizado:** se genera como `login.html`, con el mecanismo del ADR 0009.
4. **La foto principal se pinta sin esperar a JavaScript:** `SmartImage` con `priority` ya no la
   oculta.
5. **Sin servicios externos al cargar:** la fuente, las fotos de Unsplash y el mapa se sirven
   desde el sitio o se cargan bajo demanda.

nginx comprime el texto y guarda en caché, durante un año, los archivos con huella. Un script
local mide Lighthouse con la mediana de 3 corridas.

## Constitution Check
| Principio | Resultado | Justificación / ajuste | Cómo se verifica |
|---|---|---|---|
| P1 Spec antes de implementar | ✅ | Spec 023 y `design.md` `approved` | manual: `aidd.py validate` |
| P2 Tests por feature | ✅ | Cada CA comprobable con test; CA1/CA2 con el script de medición y la guarda del build para lo estructural | test: `frontend/tests/rendimiento-*.test.js(x)`, `seo-*.test.js(x)`, `probar-nginx.mjs`; manual: `scripts/medir-rendimiento.mjs` |
| P3 Dependencias nuevas con ADR | ✅ | `@fontsource-variable/plus-jakarta-sans`, verificada | manual: ADR 0010 |
| P4 Arquitectura con ADR | ✅ | Login prerenderizado y división de código del enrutado | manual: ADR 0010 y T090 |
| P5 Producción solo con aprobación humana | ✅ | Se libera con `/release` | manual: puerta de `/release` |
| P6 Rollback documentado | ✅ | Ver Rollout; sin datos | manual: Rollout |
| P7 Migraciones compatibles | ➖ | Sin esquema | — |
| P8 Autorización en el servidor | ➖ | Sin endpoints; las rutas privadas siguen protegidas por la API | — |
| P9 Entrada validada y SQL parametrizado | ➖ | Sin entradas nuevas | — |
| P10 Secretos fuera del repositorio | ✅ | El login prerenderizado solo usa `VITE_GOOGLE_CLIENT_ID`, que es público | test: gitleaks en CI |
| P11 Sin vulnerabilidades críticas o altas | ✅ | Línea base 2026-11-17: frontend sin vulnerabilidades; backend 1 baja y 20 moderadas (sin altas). La dependencia nueva no tiene código ejecutable | test: `npm audit --audit-level=high` en CI y `/release` |
| P12 Modelo de amenazas | ✅ | Sección "Modelo de amenazas" | manual: `/analyze`, `/review` |
| P13 Auditoría de datos sensibles | ➖ | No toca datos sensibles ni permisos | — |
| P14 Correlación por petición | ➖ | Sin logs ni peticiones nuevas a la API | — |
| P15 Logs sin datos sensibles | ➖ | Sin logs | — |
| P16 Accesibilidad WCAG 2.1 AA | ✅ | "Ver mapa" con teclado y foco al mapa; sin cambios visuales en el resto | test: `rendimiento-mapa.test.jsx` (teclado y foco); manual: Lighthouse Accesibilidad no baja (script de medición) y teclado en `/contacto` |
| P17 Sin lógica de negocio en las vistas | ✅ | Rutas e imágenes en `src/data/site.js` y `src/seo/`; el bloque del mapa solo gestiona su estado de vista | manual: `/review` |
| P18 Metadatos por ruta indexable | ✅ | Sin cambios en las seis rutas públicas | test: `seo-prerender.test.jsx` sigue en verde |
| P19 Noindex fuera de lo público | ✅ | `login.html` con `noindex`, sin canónica ni Open Graph, fuera del sitemap; `X-Robots-Tag` en `/login` | test: `seo-prerender.test.jsx` (caso login), `seo-archivos.test.js`, `probar-nginx.mjs` |
| P20 La interfaz usa solo el sistema de diseño | ✅ | El bloque del mapa usa `.map`, `.dt-btn` y tokens (`design.md`, sin cambios al sistema) | manual: `/review` del diff de CSS |

## Cambios por módulo
| Módulo | Cambio | Riesgo |
|---|---|---|
| `frontend/src/App.jsx` | `Login`, `AdminPanel`, `InicioPaciente`, `CitasPaciente`, `PerfilPaciente`, `CompletarPerfil` y `RestablecerContrasena` con `lazy()` dentro del `Suspense` existente; `Home` y `Layout` siguen estáticos | medio: un `Suspense` sin respaldo en alguna ruta privada |
| `frontend/src/main.jsx` | Quita `GoogleOAuthProvider`; importa `@fontsource-variable/plus-jakarta-sans` | bajo |
| `frontend/src/pages/admin/login.jsx` | Envuelve el formulario en `GoogleOAuthProvider` con `VITE_GOOGLE_CLIENT_ID` | medio: inicio de sesión con Google |
| `frontend/src/components/home/SmartImage.jsx`, `frontend/src/styles/home/global.css` | Con `priority`, la imagen se pinta desde el primer render (clase `is-priority`: sin `opacity: 0` ni esqueleto); el resto igual | bajo |
| `frontend/src/styles/home/global.css` | `--font-sans` pasa a `"Plus Jakarta Sans Variable"`, con la misma lista de reserva | bajo: diferencias de métrica de la variable |
| `frontend/index.html` | Fuera `preconnect` a Google Fonts y Unsplash, la hoja de Google Fonts y `<link rel="icon" type="image/jpeg">` (se quedan los PNG de 022) | bajo |
| `frontend/src/data/site.js` | `IMAGES.about` e `IMAGES.contact` a rutas locales con variantes de ancho | bajo |
| `frontend/public/images/` | `nosotros-{600,900,1200}.webp` y `contacto-{600,900,1200}.webp` (generado por descarga de Unsplash con `fm=webp&w=N&q=70`) | bajo |
| `frontend/src/pages/About.jsx` | La foto principal con `priority` y `srcSet`/`sizes` | bajo |
| `frontend/src/pages/Contact.jsx`, `frontend/src/styles/home/Contact.css` | Bloque del mapa según `design.md`: vista previa en `.map`, enlace "Ver mapa" (`mapLink`) que con JavaScript carga el `iframe` en el mismo hueco y le pasa el foco; foto con `srcSet` local | medio: foco y salto de diseño |
| `frontend/scripts/prerender.mjs`, `frontend/src/seo/cabecera.js` | Genera `dist/login.html` (`noindex`, título "Iniciar sesión \| Dentissa", sin canónica, Open Graph ni JSON-LD, CSS de su chunk). La guarda falla si una de las siete páginas referencia un dominio externo de la lista, si un módulo de `src/pages/admin/` o `src/pages/paciente/` es importación estática de la entrada, o si `login.html` lleva canónica | medio: el login en prerender |
| `frontend/nginx.conf` | `location = /login` → `login.html` con `X-Robots-Tag: noindex`; `gzip` para HTML, JS, CSS, JSON, XML, SVG y texto; `Cache-Control: public, max-age=31536000, immutable` en `/assets/` | medio: ruta protegida (tarea aprobada) |
| `frontend/scripts/probar-nginx.mjs` | Comprueba `/login` prerenderizado con `noindex`, `Content-Encoding: gzip` en HTML, JS y CSS, y la caché de `/assets/` | bajo |
| `frontend/scripts/medir-rendimiento.mjs` (nuevo) | Lighthouse 13.6.0 con `npx`, móvil, mediana de 3 por cada una de las siete rutas, contra la imagen de `probar-nginx`. Escribe una tabla con Rendimiento, LCP, CLS, SEO y Accesibilidad. No corre en CI | bajo |
| `frontend/package.json`, `package-lock.json` | `@fontsource-variable/plus-jakarta-sans@5.3.0` | bajo |
| `frontend/tests/` | `rendimiento-carga.test.jsx`, `rendimiento-mapa.test.jsx`, `rendimiento-recursos.test.js`; casos nuevos en `seo-prerender.test.jsx`, `seo-hidratacion.test.jsx` y `tests/support/prerenderizar.mjs` | bajo |

## Contratos y datos
Sin cambios de API ni de datos.

| Pantalla | Estados | Accesibilidad medible |
|---|---|---|
| `/contacto` · bloque del mapa | Vista previa (por defecto, también sin JavaScript); cargado | "Ver mapa" se alcanza con Tab y se activa con Enter; tras activarlo, el foco está en el `iframe` titulado "Ubicación de Dentissa en Google Maps"; objetivo ≥ 44 px (`.dt-btn`, 46 px) |
| `/login` | Llega prerenderizado; se hidrata | El orden de tabulación y los mensajes no cambian (tests existentes del login) |

Hosts externos prohibidos en las siete páginas al cargar: `fonts.googleapis.com`,
`fonts.gstatic.com`, `images.unsplash.com`, `accounts.google.com`, `maps.google.com` y
`maps.googleapis.com`. El login carga `accounts.google.com` al montar el botón de Google, como hoy;
CA5 lo permite ahí.

## Estrategia de pruebas
Vitest, del proyecto:
- **node, sobre el HTML generado** (`seo-prerender.test.jsx` amplía su `render`):
  - las siete páginas no contienen los hosts prohibidos;
  - en la portada, el contenedor de la foto principal no lleva `is-loading` y sí `is-priority`;
  - en nosotros, la foto es `loading="eager"` con `srcset` local;
  - `login.html` lleva `noindex`, el formulario y el título, y no lleva canónica, Open Graph ni
    JSON-LD;
  - en contacto no hay `iframe` y sí el enlace "Ver mapa" a `mapLink`.
- **jsdom:**
  - `rendimiento-carga.test.jsx`: al montar `/`, `/nosotros` y `/contacto` no se inserta ningún
    `<script>` de `accounts.google.com`, y `main.jsx` no usa `GoogleOAuthProvider`;
  - `rendimiento-mapa.test.jsx`: estado inicial, clic y teclado, el foco al `iframe` y "Cómo
    llegar" presente;
  - los tests existentes del login siguen en verde con el proveedor dentro de la página.
- **Hidratación:** `seo-hidratacion.test.jsx` añade `/login` (con `onRecoverableError` estricto).
- **Recursos** (`rendimiento-recursos.test.js`):
  - `index.html` sin Google Fonts, sin Unsplash y sin el ícono JPEG;
  - las seis variantes WebP existen con su ancho (cabecera WebP);
  - `site.js` sin URLs externas en `IMAGES`;
  - `global.css` declara "Plus Jakarta Sans Variable" y `main.jsx` la importa.
- **Guarda del build** (`prerender.mjs`): hosts externos, módulos privados fuera de la entrada y
  `login.html` sin canónica. Se comprueba rompiéndola.
- **nginx** (`probar-nginx.mjs`, en CI): `/login` prerenderizado con `noindex`, gzip y caché de
  assets.
- **Rendimiento** (CA1, CA2): `scripts/medir-rendimiento.mjs` a mano, con las metas de la spec.
  Lighthouse varía entre corridas y no va en CI.
- **Visual** (CA9, K3): capturas a 390 y 1440 px de las siete páginas antes y después, revisadas
  por el usuario.

## Modelo de amenazas
No aplica: no hay entradas, datos ni permisos nuevos. El login prerenderizado no contiene datos de
sesión: el componente solo usa `localStorage` en manejadores y efectos, y la guarda lo comprueba
con los textos privados de la 022. El cambio reduce los servicios externos que se cargan. El mapa
de Google se carga solo a petición, con el mismo `iframe` y `referrerPolicy` de hoy.

## Trazabilidad
| Criterio de aceptación | Cambio(s) | Test(s) |
|---|---|---|
| CA1: Rendimiento 100 / ≥ 95 | todos | `scripts/medir-rendimiento.mjs`, mediana de 3 · verificación manual: tabla por ruta contra las metas de la spec (T060) |
| CA2: LCP ≤ 2,5 s, CLS ≤ 0,1 | `SmartImage`, `About.jsx`, login prerenderizado, bloque del mapa | `medir-rendimiento.mjs` · verificación manual: LCP y CLS por ruta (T060) |
| CA3: foto de portada sin esperar a JS | `SmartImage.jsx`, `global.css` | `seo-prerender.test.jsx`: `is-priority` y sin `is-loading` en la portada; `seo-hidratacion` sin errores · verificación manual: portada sin JavaScript, la foto se ve |
| CA4: sin código del panel y el portal | `App.jsx` | guarda de `prerender.mjs` (módulos privados como entrada dinámica, fuera de la estática); tests del panel y el portal existentes en verde |
| CA5: Google solo en el login | `main.jsx`, `login.jsx` | `rendimiento-carga.test.jsx`; tests del login existentes · verificación manual: entrar con Google en el contenedor local con el client ID de desarrollo |
| CA6: mapa bajo demanda | `Contact.jsx`, `Contact.css` | `rendimiento-mapa.test.jsx`; `seo-prerender.test.jsx` (sin `iframe`) · verificación manual: a 390 y 1440 px contra `design.md` |
| CA7: fotos propias del sitio | `site.js`, `public/images/`, `About.jsx`, `Contact.jsx` | `rendimiento-recursos.test.js`; `seo-prerender.test.jsx` (sin Unsplash; `eager` y `srcset` en nosotros) |
| CA8: sin fuentes externas, misma tipografía | `index.html`, `main.jsx`, `global.css`, `package.json` | `rendimiento-recursos.test.js`; guarda de hosts · verificación manual: la tipografía se ve igual (capturas) |
| CA9: todo igual, SEO 100, accesibilidad, hidratación | todos | `seo-*.test.js(x)` y `seo-hidratacion` en verde; `medir-rendimiento.mjs` (SEO 100, Accesibilidad sin bajar) · verificación manual: capturas a 390 y 1440 px |
| CA10: compresión y caché | `nginx.conf` | `probar-nginx.mjs`: `Content-Encoding: gzip` y `Cache-Control` de `/assets/` |
| RNF: accesibilidad del botón del mapa | `Contact.jsx` | `rendimiento-mapa.test.jsx` (teclado y foco) |
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
  (ADR 0010).
- Imagen para compartir: sin cambios.
- Brechas `SE`: ninguna nueva.

## Rollout
- Feature flag: no aplica. El cambio es de entrega, no de flujo, y se revierte reconstruyendo.
- Orden de despliegue: solo el frontend (`docker compose … build frontend && up -d frontend`,
  conservando los ajustes locales del compose del servidor).
- Compatibilidad: los nombres con huella cambian. Un navegador con la versión anterior abierta
  pide chunks viejos, que dejan de existir; recargar lo resuelve, como en cualquier despliegue de
  hoy.
- Rollback: en el servidor, `git checkout <commit anterior>` y reconstruir el frontend. Sin datos.
- Métricas a vigilar: Lighthouse en producción en las siete rutas, el login con Google y el panel
  y el portal al recargar.

## Decisiones (→ ADR si son arquitectónicas)
- **Fuente** → ADR 0010: `@fontsource-variable/plus-jakarta-sans`, como Jost. Descargar los
  `woff2` a mano no da subconjuntos ni versiones.
- **Login prerenderizado** → ADR 0010 (decisión del usuario, 2026-11-17). Solo dividir el código
  no llega a 100.
- **División de código:** `lazy()` por ruta privada dentro del `Suspense` existente.
  `Home` estático: es la ruta más visitada y llega prerenderizada.
- **Foto principal:** `SmartImage` con `priority` no oculta la imagen; sin `preload` adicional (el
  `<img>` ya está al principio del HTML, con un retraso de descarga de 33 ms).
- **Fotos de Unsplash:** se descargan en WebP a 600, 900 y 1200 px con los parámetros de Unsplash
  (`fm=webp&w=N&q=70`), sin herramientas nuevas. La licencia de Unsplash permite el uso comercial
  sin atribución.
- **Mapa:** enlace `mapLink` que, con JavaScript, monta el `iframe` en el mismo `.map`
  (`design.md`). Así funciona también sin JavaScript.
- **Medición:** script propio que llama a Lighthouse con `npx` (herramienta de desarrollo, no
  dependencia del proyecto), igual que en la 022, contra la imagen de `probar-nginx` con backend
  ficticio.
- **Compresión:** `gzip` en nginx (Cloudflare ya comprime en producción; el origen queda igual en
  local y si cambia el proxy). Sin `brotli`: la imagen oficial no trae el módulo.
- **Fuera:** la caché de `robots.txt` y `sitemap.xml` en Cloudflare queda para su `/fix`, como dice
  la spec.

## Impacto en arquitectura
- `docs/architecture.md`, módulo "SEO y prerender": `login.html` y la división de código de las
  rutas privadas.
- Fila de nginx: compresión y caché de `/assets/`.

## Riesgos y mitigaciones
- **Conflicto con la rama de la maqueta:** `feat/maqueta-iot` puede tocar `App.jsx` o las páginas
  del paciente, por ejemplo con el QR del portal. Mitigación: esta spec solo cambia los `import` de
  `App.jsx`, y si la maqueta se fusiona antes se rehace el cambio sobre ella.
- **Login prerenderizado y Google:** el botón de Google se monta en un efecto de la librería. Si el
  HTML del servidor y el del cliente difieren, falla la hidratación. Mitigación: `/login` entra en
  `seo-hidratacion.test.jsx` con `onRecoverableError` estricto.
- **La portada no llega a 95:** depende del CSS, la fuente y la foto. Mitigación: medir tras cada
  bloque con `medir-rendimiento.mjs`. Si se queda corta, se revisa en `/review` con las tres
  corridas, como dice la spec.
- **Ruido de Lighthouse en las metas de 100:** mediana de 3 en el mismo equipo. Si una queda en
  98–99 solo por variación, se decide en `/review` (supuesto de la spec).
- **Tipografía:** la variable puede diferir mínimamente de la estática de Google. Mitigación:
  capturas antes y después (CA9).
