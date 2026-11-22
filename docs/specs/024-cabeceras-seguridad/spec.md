---
id: 024
slug: cabeceras-seguridad
status: released
released: v1.5.0 (2026-11-22)
created: 2026-11-19
extends: []
---

# 024 · Protecciones del navegador en todo el sitio

## Problema
Las páginas del sitio (públicas, inicio de sesión y paneles del personal y del paciente, donde se ven
citas y expedientes) llegan al navegador sin las protecciones que este aplica cuando el servidor se
las pide. Hoy cualquiera puede mostrar el sitio dentro de una página suya para engañar a alguien y
que haga clic sin darse cuenta; si alguna vez se cuela un script ajeno, el navegador lo ejecuta sin
restricciones; y nada obliga a usar siempre la conexión segura (riesgo RS6 de
[docs/security.md](../../security.md), señalado también en las reviews 022/R22 y 023/R24). Desde el
2026-11-18 el repositorio es público, así que la ausencia está a la vista de cualquiera. Esta spec
atiende RS6 por completo.

## Historias de usuario
- Como paciente o miembro del personal, quiero que el sitio no pueda usarse dentro de páginas ajenas
  ni ejecutar código de terceros no autorizados, para que mis datos y mis acciones no se puedan
  desviar.
- Como paciente o miembro del personal, quiero que el sitio funcione exactamente igual que antes
  (inicio de sesión con Google, mapa, imágenes, paneles), para que las protecciones no me estorben.
- Como responsable del sitio, quiero que una versión futura no pueda quitar estas protecciones sin
  que lo note la comprobación automática, para no perderlas sin darme cuenta.

## Criterios de aceptación
- [x] CA1 · Dada cualquier respuesta del sitio (páginas públicas, inicio de sesión, paneles, página
  "no encontrada" y archivos como imágenes, estilos y scripts), cuando el navegador la recibe,
  entonces se le indica que no adivine el tipo de un archivo distinto al declarado, que al ir a otro
  sitio solo comunique el dominio de origen y nunca la ruta (ni nada al pasar de la conexión segura a
  una que no lo es), y que el sitio no usa cámara, micrófono ni ubicación.
- [x] CA2 · Dada cualquier respuesta del sitio por la conexión segura, cuando el navegador la recibe,
  entonces queda indicado que use solo la conexión segura con `sistema.dentissa.app` durante al menos
  6 meses, sin abarcar otros subdominios de `dentissa.app` ni pedir la lista de precarga de los
  navegadores.
- [x] CA3 (abuso) · Dado un atacante que muestra cualquier página del sitio (incluidos el inicio de
  sesión y los paneles) dentro de un marco en una página suya, cuando un navegador abre esa página,
  entonces el navegador se niega a mostrar el sitio dentro del marco.
- [x] CA4 (abuso) · Dada una página del sitio en la que un atacante consigue insertar un script, un
  marco o un recurso de un dominio que el sitio no usa, cuando el navegador la carga, entonces no lo
  ejecuta ni lo carga. Solo se permiten el propio sitio y los dos servicios que el sitio necesita: el
  inicio de sesión con Google y el mapa de Google. Las páginas solo los cargan donde se usan (Google en
  el inicio de sesión; el mapa en contacto, al pulsar "Ver mapa"), como ya exige la spec 023.
- [x] CA5 · Dado el inicio de sesión, cuando un paciente usa "Iniciar sesión con Google" o, en el
  panel de registro, "Registrarse con Google", entonces el botón aparece y el flujo de Google termina
  igual que antes, y la consola del navegador no muestra bloqueos.
- [x] CA6 · Dada la página de contacto, cuando alguien pulsa "Ver mapa", entonces el mapa de Google se
  muestra dentro del bloque como antes, y "Cómo llegar" sigue abriendo Google Maps.
- [x] CA7 · Dadas las páginas públicas, el inicio de sesión, el restablecimiento de contraseña y los
  paneles del personal y del paciente (con las imágenes que sube el personal, las fotos de la galería
  y los datos de la clínica para buscadores), cuando se recorren con una sesión de cada rol, entonces
  se ven y funcionan igual que antes y la consola del navegador no muestra ningún bloqueo.
- [x] CA8 · Dada la página "no encontrada" y las rutas privadas sin sesión, cuando se piden, entonces
  llevan las mismas protecciones que el resto y conservan las indicaciones de no indexar que ya
  tenían.
- [x] CA9 · Dada una versión futura que quite o debilite cualquiera de las protecciones de CA1 a CA4
  en alguna respuesta, cuando se ejecuta la comprobación automática del proyecto, entonces falla e
  indica qué protección y en qué respuesta.

## Fuera de alcance
- Protecciones de las respuestas de datos del sistema (la parte que atiende a las páginas ya las
  tiene desde la spec 018 y no cambian).
- Cambios en Cloudflare, el túnel o el dominio, y la precarga de HTTPS en los navegadores o su
  aplicación a otros subdominios de `dentissa.app`.
- Recoger y guardar avisos de bloqueos del navegador (no hay dónde recibirlos ni quién los lea).
- Aislamiento entre ventanas y orígenes más allá de lo que pide CA3 (los flujos de Google podrían
  romperse).
- El límite general de peticiones y el resto de riesgos abiertos de `docs/security.md`.

## Seguridad y privacidad
- Datos sensibles involucrados: ninguno nuevo. Las protecciones se aplican a las páginas que muestran
  datos de salud y de identificación (paneles del personal y portal del paciente), sin cambiar quién
  ve qué.
- Quién puede hacer qué: sin cambios de permisos.
- Casos de abuso:
  - Como atacante, muestro el sitio dentro de un marco en mi página para que un paciente o el
    personal haga clic sin saberlo → el navegador no lo muestra (CA3).
  - Como atacante, consigo insertar en una página un script o un recurso de un dominio mío → el
    navegador no lo ejecuta ni lo carga (CA4).
  - Como atacante en una red pública, intento que el navegador use la conexión sin cifrar para leer
    o alterar el tráfico → el navegador que ya visitó el sitio usa solo la conexión segura (CA2).

## Cobertura de riesgos
| Corrección | Alcance | Criterios / motivo y destino |
|---|---|---|
| RS6.a — Añadir las cabeceras en el servidor web | dentro | CA1, CA2, CA3, CA8, CA9 |
| RS6.b — Política de contenido compatible con Google Sign-In y las fuentes | dentro | CA4, CA5, CA6, CA7 |

## Auditoría
No aplica: la spec no cambia el acceso a datos sensibles, la autenticación ni los permisos; solo pide
al navegador que aplique protecciones.

## Requisitos no funcionales
- Rendimiento: Lighthouse móvil no baja más de 2 puntos en ninguna página pública ni en el inicio de
  sesión respecto de v1.4.1 (spec 023, CA1).
- Buenas prácticas: Lighthouse "Prácticas recomendadas" no baja en ninguna página pública.
- Descubribilidad: sin cambios. Las rutas indexables, sus títulos, descripciones, vista previa al
  compartir y datos para buscadores siguen igual (Lighthouse SEO 100); las rutas privadas y la 404
  conservan su "no indexar" (`docs/seo.md`).
- Accesibilidad: sin cambios visibles (P16).

## Preguntas abiertas
- Ninguna.

## Decisiones
| Fecha | Tipo | Pregunta / conflicto | Decisión | Fuente |
|---|---|---|---|---|
| 2026-11-19 | brecha | ¿Obligar a usar siempre la conexión segura? | Sí, solo `sistema.dentissa.app`, 6 meses, sin subdominios ni precarga | usuario |
| 2026-11-19 | brecha | Las respuestas de datos del sistema ya obligaban a la conexión segura 1 año desde el mismo dominio (`/analyze` A4) | Las páginas también mandan 1 año: un solo plazo; cumple CA2 ("al menos 6 meses"), sin otros subdominios de `dentissa.app` | usuario |
| 2026-11-19 | brecha | ¿Política de contenido en modo aviso primero o activa? | Activa desde la primera versión, tras probar en local cada pantalla pública, el inicio de sesión con Google, el mapa y los paneles de cada rol | usuario |
| 2026-11-19 | brecha | ¿Alguna página necesita incrustar el sitio? | No: se prohíbe en todas las páginas | usuario |
| 2026-11-19 | implícita | Servicios externos que el sitio necesita | Inicio de sesión con Google (solo `/login`) y mapa de Google (solo `/contacto`); fuentes e imágenes propias desde v1.4.0; WhatsApp y redes sociales son enlaces, no recursos que se carguen | docs/specs/023-rendimiento-sitio/spec.md (CA7, CA8) |
| 2026-11-19 | supuesto | Información que se comunica al ir a otro sitio | Solo el dominio; nada al bajar a una conexión sin cifrar | práctica habitual; sin requisito en contra |
| 2026-11-19 | supuesto | Capacidades del navegador | El sitio no usa cámara, micrófono ni ubicación: se declaran desactivadas (el QR de la cita se muestra, no se escanea en la web) | `maqueta-iot/` usa la cámara en la app, no en la web |
| 2026-11-19 | brecha | El sitio cambia de página sin recargar: una política por página bloquearía el mapa o Google al llegar navegando (comprobado con una prueba de concepto en /plan) | Una sola política para todo el sitio que permite los dos servicios; el código solo los carga en el login y en contacto (spec 023, CA7 y CA8). Se corrige el texto de CA4 | usuario |
| 2026-11-19 | implícita | Las respuestas de datos del sistema | Ya tienen sus protecciones (spec 018); fuera de alcance | `backend/src/config/app.js` |

## Notas para /plan
- Riesgo citado: RS6 en `docs/security.md` (A02 Security Misconfiguration). Reviews 022/R22 y
  023/R24: en nginx, un `add_header` dentro de una `location` anula los del bloque `server` (hoy
  pasa en las ubicaciones con `X-Robots-Tag` y `Cache-Control`); hay que repetirlas o usar un
  `include` común.
- Inventario de orígenes externos (2026-11-19): `accounts.google.com` (script `gsi/client`, estilos y
  marco del botón), `maps.google.com`/`www.google.com` (marco del mapa en contacto). El JSON-LD es un
  `<script type="application/ld+json">` en línea en la portada (dato, no ejecutable, pero la CSP
  debe permitirlo o no afectarlo). Revisar estilos en línea de React y del botón de Google.
- Las imágenes que sube el personal se sirven desde el mismo origen (`/uploads` vía la API); revisar
  `VITE_ASSETS_URL` por si apunta a otro origen.
- Prueba existente que se puede ampliar: `frontend/scripts/probar-nginx.mjs` (contenedor real).
- HSTS solo tiene efecto por HTTPS; en local se comprueba la cabecera, no el comportamiento.

## Historial
| Fecha | Cambio | Motivo |
|---|---|---|
| 2026-11-19 | Spec creada en borrador | /specify, riesgo RS6 (reviews 022/R22 y 023/R24) |
| 2026-11-19 | Aprobada | usuario |
| 2026-11-19 | CA4: los dos servicios se permiten en todo el sitio y solo se cargan donde se usan; aprobada de nuevo | /plan 024 (prueba de concepto), decisión del usuario |
| 2026-11-19 | Decisión del plazo de la conexión segura (1 año) | /analyze 024 A4, decisión del usuario |
