---
id: 023
slug: rendimiento-sitio
status: draft
created: 2026-11-17
extends: [017, 022]
---

# 023 · Rendimiento del sitio público y el login

## Problema
Las páginas públicas y el login tardan en mostrarse en un celular. En Lighthouse Rendimiento
(móvil) la portada saca **67** y su contenido principal tarda **6,9 s** en verse. `/nosotros` saca
**79** (5,0 s), `/login` **85** (4,4 s) y `/contacto` **90**, con el hilo principal bloqueado 340 ms
por el mapa. Las causas, medidas el 2026-11-17 sobre el código de v1.3.0:
- La foto de la portada ya está descargada a los 0,2 s, pero no se ve hasta 2,3 s después: la
  página espera a que cargue toda la aplicación.
- Cada página descarga la aplicación completa, unos 404 KiB, incluidos el panel del personal y el
  portal del paciente. Unos 250 KiB no se usan.
- El servicio de inicio de sesión con Google (101 KiB) se carga en todas las páginas, aunque solo
  se usa al iniciar sesión.
- La foto de `/nosotros` viene de un servidor externo (Unsplash) y empieza a descargarse tarde; los
  datos del sitio guardan además una segunda foto externa que hoy no se muestra.
- El mapa de `/contacto` descarga unos 330 KiB de un servicio externo nada más entrar, aunque el
  visitante no lo mire.
- El texto depende de un servicio externo de fuentes.

Un sitio lento pierde visitas y Google lo tiene en cuenta al ordenar resultados: es el siguiente
paso tras el objetivo 4 (sitio indexable).

## Historias de usuario
- Como paciente que entra desde el celular, quiero que cada página se vea enseguida para encontrar
  la información o agendar sin esperar.
- Como paciente o personal, quiero que el login cargue rápido y que entrar con Google siga
  funcionando.
- Como visitante de contacto, quiero ver la dirección al momento y abrir el mapa solo si lo
  necesito.
- Como dueño de la clínica, quiero que Google vea un sitio rápido para que lo muestre mejor.

## Criterios de aceptación
Medición de referencia ("la medición"): Lighthouse 13.6.0, perfil móvil por defecto, contra el
frontend construido para producción y servido en local, **mediana de 3 corridas** por página, en
el mismo equipo que la línea base. Páginas: `/`, `/nosotros`, `/galeria`, `/contacto`,
`/aviso-de-privacidad`, `/terminos-de-servicio` y `/login`.

- [ ] CA1 · Dadas las siete páginas, cuando se hace la medición, entonces obtienen en Rendimiento:
  **100** en `/nosotros`, `/galeria`, `/aviso-de-privacidad`, `/terminos-de-servicio` y `/login`, y
  **≥ 95** en `/` (portada) y `/contacto`.
- [ ] CA2 · Dadas las siete páginas, cuando se hace la medición, entonces cada una tiene **LCP ≤ 2,5 s**
  y **CLS ≤ 0,1**.
- [ ] CA3 · Dada la portada, cuando se abre sin JavaScript, entonces su foto principal y su título se
  ven (la foto no queda oculta a la espera de la aplicación); con JavaScript, la foto no parpadea
  ni se oculta y vuelve a aparecer.
- [ ] CA4 · Dada cualquiera de las siete páginas, cuando se carga, entonces no descarga el código del
  panel del personal ni del portal del paciente; ese código se descarga solo al entrar en esas
  secciones, y el panel y el portal funcionan igual que antes.
- [ ] CA5 · Dada una página pública, cuando se carga, entonces no contacta con el servicio de inicio
  de sesión de Google; dado el login, iniciar sesión con Google funciona igual que antes, y también
  donde hoy se ofrece ese botón.
- [ ] CA6 · Dada la página de contacto, cuando se abre, entonces el mapa interactivo no se descarga;
  en su lugar se ve la dirección y la acción "Ver mapa". Al activarla con ratón, toque o teclado
  (Enter), el mapa aparece en el mismo sitio, y el enlace "Cómo llegar", que abre la ubicación en
  Google Maps, sigue disponible en todo momento.
- [ ] CA7 · Dadas las páginas públicas, cuando se cargan, entonces ninguna foto viene de un servidor
  externo: la foto de nosotros se sirve desde el propio sitio, en un tamaño adecuado a la pantalla,
  y no se retrasa si está a la vista al cargar; los datos del sitio no guardan direcciones de fotos
  externas.
- [ ] CA8 · Dadas las siete páginas, cuando se cargan, entonces no contactan con ningún servicio
  externo de fuentes, el texto se ve mientras cargan las fuentes y la tipografía es la misma de hoy.
- [ ] CA9 · Dadas las siete páginas, después del cambio, entonces se ven igual que antes, salvo el mapa
  de CA6, a 390 y 1440 px. Lighthouse SEO sigue en 100, la accesibilidad no empeora y las páginas se
  hidratan sin errores.
- [ ] CA10 · Dado el sitio desplegado, entonces cada archivo de texto que sirve el servidor propio
  (HTML, JavaScript, CSS, XML, texto) llega comprimido a quien lo pide, y los archivos con huella
  en el nombre se pueden guardar en caché durante mucho tiempo.

## Fuera de alcance
- Rendimiento del panel del personal y del portal del paciente con sesión iniciada: medirlo exige
  datos y sesión de prueba. Va a otra spec; esta solo garantiza que su código no pese en las páginas
  públicas (CA4).
- Cambiar textos, diseño o contenido de las páginas, salvo la vista previa del mapa (CA6).
- Sustituir las fotos de ejemplo por fotos reales de la clínica (se podrá hacer después sin perder la
  optimización).
- La caché de Cloudflare de `robots.txt` y `sitemap.xml` (va en su propio `/fix`).
- 100 en la portada y en contacto: su meta es ≥ 95 (foto principal, contenido de la API y mapa).
- Rendimiento en escritorio: la meta se fija en móvil, que es la más exigente.

## Seguridad y privacidad
- Datos sensibles involucrados: ninguno. Las páginas públicas y el login no muestran datos de
  pacientes; el código del panel y del portal sigue exigiendo sesión en la API.
- Quién puede hacer qué: sin cambios de permisos.
- Casos de abuso: no aplica. No hay entradas nuevas ni datos nuevos, y el cambio reduce los
  servicios externos que se cargan (Google sign-in, mapa, fuentes, fotos). El mapa externo solo se
  carga cuando el visitante lo pide.

## Diseño
Lo único visible que cambia es el bloque del mapa en `/contacto`: antes de cargar el mapa se ve la
dirección con "Ver mapa" y el enlace "Cómo llegar", con los componentes y tokens
del [sistema de diseño](../../design/system.md). El resto de pantallas debe verse idéntico. Acta: [design.md](design.md) (sin ciclo de candidatos).

## Criterios de diseño
Modo: operar · umbral 80 · mínimo por punto 3 · presupuesto 3 candidatos (solo para el bloque del
mapa).

| ID | Qué se mide | Objetivo | Sale de |
|---|---|---|---|
| K1 | "Ver mapa" visible y accionable sin desplazamiento horizontal | visible a 390 y 1440 px; objetivo de toque ≥ 44 × 44 px | CA6 |
| K2 | El bloque reserva el espacio del mapa | el bloque mide lo mismo antes y después de cargar el mapa (Lighthouse no pulsa "Ver mapa": se comprueba con un test y una captura) | CA6 |
| K3 | Resto de páginas sin cambios visuales | comparación a 390 y 1440 px con la versión actual | CA9 |

Puertas: las de `design-spec/references/criterios.md` §2.

## Requisitos no funcionales
- Rendimiento: CA1 y CA2 sobre la medición. En producción (tras Cloudflare) se comprueba a mano al
  liberar, con las mismas metas como referencia.
- Descubribilidad: sin cambios; las reglas de `docs/seo.md` siguen (SEO 100, `noindex` en privadas,
  canónicas).
- Accesibilidad: WCAG 2.1 AA (P16). "Ver mapa" se maneja con teclado, tiene nombre accesible y
  contraste ≥ 4,5:1, y al cargar el mapa el foco no se pierde.

## Decisiones
| Fecha | Tipo | Pregunta / conflicto | Decisión | Fuente |
|---|---|---|---|---|
| 2026-11-17 | brecha | ¿Qué páginas entran? | Las seis públicas y el login; paneles con sesión en otra spec | usuario |
| 2026-11-17 | brecha | Meta de rendimiento | Lighthouse móvil ≥ 90, LCP ≤ 2,5 s y CLS ≤ 0,1 en las siete | usuario |
| 2026-11-17 | brecha | Meta más alta por página | 100 en nosotros, galería, aviso, términos y login; ≥ 95 en portada y contacto (reemplaza el ≥ 90 general) | usuario |
| 2026-11-17 | supuesto | Ruido de Lighthouse en las páginas con meta 100 | Cuenta la mediana de 3; si tras las optimizaciones una se queda en 98–99 solo por variación entre corridas, se decide en /review con la evidencia de las 3 corridas, sin rebajar la meta en la spec | sesión · confirmado por el usuario 2026-11-17 (/analyze A22) |
| 2026-11-17 | brecha | Mapa de contacto | Vista previa con "Ver mapa"; el mapa carga al activarlo | usuario |
| 2026-11-17 | brecha | Fotos de Unsplash | Alojarlas en el sitio, optimizadas (la licencia de Unsplash lo permite) | usuario |
| 2026-11-17 | supuesto | Cómo se mide | Lighthouse 13.6.0 móvil, mediana de 3, contenedor local con el backend ficticio, igual que la línea base de 022 T002; el login se mide con el client ID de Google en el build | sesión · confirmado por el usuario 2026-11-17 (/analyze A22, A8) |
| 2026-11-17 | supuesto | Tipografía | Se conserva la misma fuente, servida desde el propio sitio | sesión |
| 2026-11-17 | diseño | Bloque del mapa | Sin ciclo de candidatos; piezas del sistema; K1–K3 en /implement ([design.md](design.md)) | usuario |
| 2026-11-17 | implícita | La "foto de contacto" de `site.js` no se muestra en ninguna página | CA7 se limita a la foto de nosotros y a quitar la dirección externa sin uso | código: `IMAGES.contact` sin referencias (/analyze A7) |
| 2026-11-17 | implícita | `/login` deja de recibir `app.html` (022, CA8) | Se declara `extends: [022]`: el login sigue con `noindex`, ahora con su propio HTML | `docs/specs/022-sitio-indexable/plan.md` (/analyze A12) |
| 2026-11-17 | implícita | No hay principio de rendimiento en la constitución | La meta la fija esta spec; no hay presupuesto de JavaScript previo | `docs/constitution.md`, `docs/seo.md` (Presupuesto) |

## Notas para /plan
Línea base (2026-11-17, `main` 7978d70, contenedor local con backend ficticio, 1 corrida por página):

| Página | Rend. | FCP | LCP | TBT | CLS | Elemento LCP |
|---|---|---|---|---|---|---|
| `/` | 67 | 2,5 s | 6,9 s | 220 ms | 0 | foto de portada local (80 KiB); retraso de render 2,3 s |
| `/nosotros` | 79 | 2,2 s | 5,0 s | 30 ms | 0,006 | foto de Unsplash con `loading="lazy"` |
| `/galeria` | 99 | 1,7 s | 1,7 s | 50 ms | 0 | — |
| `/contacto` | 90 | 1,8 s | 1,8 s | 340 ms | 0 | texto; Google Maps ~330 KiB |
| `/aviso-de-privacidad` | 100 | 1,5 s | 1,5 s | 0 | 0 | — |
| `/terminos-de-servicio` | 100 | 1,5 s | 1,5 s | 40 ms | 0 | — |
| `/login` | 85 | 1,5 s | 4,4 s | 30 ms | 0 | logo PNG (49 KiB) |

Pistas observadas, no requisitos:
- `index-*.js` de 404 KiB con unos 250 KiB sin usar en todas las páginas: rutas del panel y del
  portal sin división de código.
- `GoogleOAuthProvider` envuelve toda la app en `main.jsx` y carga `accounts.google.com/gsi/client`.
- `SmartImage` oculta la imagen (`is-loading`) hasta `onLoad` tras hidratar: posible causa del
  retraso de render de la portada.
- CSS de 77 KiB con reglas sin usar; Google Fonts (Plus Jakarta Sans) por `<link>` en `index.html`;
  `favicon.jpeg` de 43 KiB que se pide en cada página.
- nginx sin `gzip` en el contenedor (Cloudflare comprime en producción); sin `Cache-Control` para
  `/assets/`.
- Las fotos están en `frontend/src/data/site.js` (`about`, `contact`) y el mapa en `mapEmbedSrc`.

## Historial
| Fecha | Cambio | Motivo |
|---|---|---|
| 2026-11-17 | Spec creada en borrador | /specify, decisión del usuario tras v1.3.0 |
| 2026-11-17 | Metas por página en CA1 (100 / ≥ 95) | usuario |
| 2026-11-17 | Aprobada | usuario |
| 2026-11-17 | Correcciones de /analyze A7, A12, A22, A23 (foto de contacto, extends 022, supuestos confirmados, nombres del mapa); vuelve a draft | /analyze 023 |
