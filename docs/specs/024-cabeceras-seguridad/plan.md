---
spec: 024-cabeceras-seguridad
status: approved
constitution_version: 1.0.0
created: 2026-11-19
---

# Plan · 024 Protecciones del navegador en todo el sitio

## Enfoque técnico
Las protecciones son cabeceras HTTP que nginx añade a cada respuesta que sirve él mismo: páginas,
login, rutas privadas, 404, redirecciones y archivos estáticos. Las respuestas que nginx reenvía a
Express (`/api/`, `/uploads/`) ya llevan las de helmet (spec 018) y no se tocan. Las cabeceras viven
en un solo archivo, `frontend/nginx-seguridad.conf`, que se incluye en cada `location` que sirve
contenido propio. Así se evita el fallo de 022/R22: en nginx, un `add_header` dentro de una
`location` anula los del `server`.

La política de contenido (CSP) es una sola para todo el sitio, porque el sitio cambia de página sin
recargar (decisión del usuario). Es estricta con los scripts: solo el propio sitio y el script de
Google Sign-In, sin código en línea ni `eval`. Los estilos en línea se permiten (decisión del
usuario). Una prueba sobre la configuración y la prueba de nginx en el contenedor (que ya corre en
CI) impiden quitar o debilitar una protección sin que falle algo (CA9).

## Constitution Check
Constitución 1.0.0, todavía en `draft`: el check se hace contra una constitución sin aprobar.

| Principio | Resultado | Justificación / ajuste | Cómo se verifica |
|---|---|---|---|
| P1 Spec antes de implementar | ✅ | Spec 024 aprobada (CA4 corregido y aprobado de nuevo el 2026-11-19) | manual: `aidd.py status` |
| P2 Tests por feature | ✅ | Prueba de la configuración y ampliación de `probar-nginx.mjs` (CI) antes de cambiar nginx | test: `seguridad-cabeceras.test.js`, `probar-nginx.mjs` |
| P3 Dependencias con ADR | ➖ | Sin dependencias nuevas | — |
| P4 Arquitectura con ADR | ✅ | No contradice `architecture.md`; se documenta la regla "un servicio externo nuevo exige tocar la CSP" en T090 | manual: T090 |
| P5 Producción con aprobación humana | ✅ | `/release` | manual: T096 |
| P6 Rollback documentado | ✅ | Rollout: volver a la imagen anterior del frontend; HSTS no se revierte (ver Riesgos) | manual: T096 |
| P7 Migraciones compatibles | ➖ | Sin esquema | — |
| P8 Autorización en el servidor | ➖ | Sin endpoints | — |
| P9 Entrada validada | ➖ | Sin entradas nuevas | — |
| P10 Secretos fuera del repo | ✅ | Sin secretos: las cabeceras y los orígenes de Google son públicos | test: gitleaks en CI |
| P11 Sin vulnerabilidades altas | ✅ | Sin dependencias nuevas; picomatch (desarrollo) con excepción vigente hasta 2027-01-31 | test: `npm audit` en CI y en `/release` |
| P12 Modelo de amenazas | ✅ | TM1–TM6 con control y test | test: los de Trazabilidad |
| P13 Auditoría de datos sensibles | ➖ | No cambia el acceso a datos ni la autenticación (spec, Auditoría) | — |
| P14 Correlación por petición | ➖ | Sin logs ni peticiones nuevas | — |
| P15 Logs sin datos sensibles | ➖ | Sin logs nuevos | — |
| P16 WCAG 2.1 AA | ✅ | Sin cambios visibles; el recorrido de CA7 confirma que nada deja de verse | manual: recorrido de CA7 |
| P17 Sin lógica en las vistas | ➖ | Sin cambios en vistas | — |
| P18 Metadatos por ruta indexable | ✅ | Sin cambios; las pruebas de la 022 siguen en verde | test: `seo-prerender.test.jsx` |
| P19 Noindex fuera de lo público | ✅ | El `X-Robots-Tag` de login, rutas privadas y 404 se conserva junto a las cabeceras nuevas | test: `probar-nginx.mjs` (CA8) |
| P20 Sistema de diseño | ➖ | Sin estilos nuevos | — |

Conteo: ✅ 11 · ➖ 9 · ❌ 0.

## Cambios por módulo
| Módulo | Cambio | Riesgo |
|---|---|---|
| `frontend/nginx-seguridad.conf` (nuevo) | Las siete cabeceras (ver Contratos), cada una con `always` | medio: una CSP incompleta rompe una parte del sitio |
| `frontend/nginx.conf` | `include /etc/nginx/snippets/seguridad.conf;` en cada `location` que sirve contenido propio: las seis públicas, la redirección sin barra final, `/assets/`, `/login`, rutas privadas, `/` y `/404.html`. No en `/api/` ni `/uploads/` | medio: una `location` nueva sin el `include` quedaría desprotegida (lo detecta la prueba) |
| `frontend/Dockerfile` | `COPY nginx-seguridad.conf /etc/nginx/snippets/seguridad.conf` | bajo |
| `frontend/tests/seguridad-cabeceras.test.js` (nuevo) | Prueba de la configuración (ver Estrategia) | bajo |
| `frontend/scripts/probar-nginx.mjs` | Comprobaciones de las cabeceras en cada tipo de respuesta | bajo |
| `frontend/scripts/probar-csp.mjs` (nuevo) | Recorrido con Chrome sin cabeza: páginas públicas, "Ver mapa", login con los dos botones de Google y navegación sin recargar, con el registro de bloqueos de la CSP. Herramienta de verificación, fuera de CI (necesita Chrome y red hacia Google) | bajo |
| `docs/architecture.md`, `docs/security.md` | T090: la CSP y cómo añadir un servicio externo; RS6 en `/release` | bajo |

Rutas protegidas tocadas (`nginx.conf`, `Dockerfile`): solo mediante las tareas aprobadas de esta spec.

## Contratos y datos
Sin endpoints, esquema ni datos. El contrato es el conjunto de cabeceras de cada respuesta que sirve
nginx:

| Cabecera | Valor | CA |
|---|---|---|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' https://accounts.google.com/gsi/client; style-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/style; img-src 'self' data:; font-src 'self' data:; connect-src 'self' https://accounts.google.com/gsi/; frame-src https://accounts.google.com/gsi/ https://maps.google.com https://www.google.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'` | CA3, CA4 |
| `X-Frame-Options` | `DENY` (navegadores sin `frame-ancestors`) | CA3 |
| `X-Content-Type-Options` | `nosniff` | CA1 |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | CA1 |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | CA1 |
| `Strict-Transport-Security` | `max-age=15552000` (180 días, sin `includeSubDomains` ni `preload`) | CA2 |

- `font-src data:`: el build mete en el CSS una fuente diminuta en `data:` (comprobado en la prueba
  de concepto). Permitirla no da ejecución de código.
- `style-src 'unsafe-inline'` (decisión del usuario): lo piden los atributos `style` del HTML
  prerenderizado (proporciones de la foto en la portada y en nosotros) y los estilos que inyecta
  Google Sign-In en el login.
- `frame-src` incluye `www.google.com` porque el mapa de `maps.google.com` puede redirigir allí.
- `upgrade-insecure-requests` no se usa: todos los recursos son del mismo origen o `https`, y en
  local (`http`) rompería las pruebas.
- HSTS solo tiene efecto por HTTPS (Cloudflare). En local se comprueba la cabecera, no su efecto.
- Las respuestas de `/api/` y `/uploads/` conservan las cabeceras de helmet. Su HSTS (1 año con
  `includeSubDomains`) solo abarca subdominios de `sistema.dentissa.app`, no otros de
  `dentissa.app`, así que CA2 se cumple.

## Estrategia de pruebas
- **Configuración** (`frontend/tests/seguridad-cabeceras.test.js`, Vitest en entorno node, CI):
  - lee `nginx-seguridad.conf` y comprueba cada cabecera con su valor y `always`;
  - analiza la CSP por directivas:
    - `script-src` sin `'unsafe-inline'`, `'unsafe-eval'`, `*`, `data:` ni `http:`;
    - `frame-ancestors 'none'`, `object-src 'none'` y `base-uri 'self'`;
    - los orígenes externos son exactamente los de la tabla;
  - comprueba que cada `location` de `nginx.conf`, salvo `/api/` y `/uploads/`, incluye el archivo;
  - comprueba que el `Dockerfile` lo copia a la ruta del `include`.
  - Cada caso se comprueba rompiendo la protección que vigila.
- **Contenedor** (`scripts/probar-nginx.mjs`, CI "Prueba de nginx"): las seis cabeceras con su valor
  en `/`, cada página pública, `/login`, `/admin/usuarios`, `/restablecer-contrasena?token=x`,
  `/no-existe` (404), `/nosotros/` (301), un `/assets/*.js` e `/images/hero-dentissa.webp`; el
  `X-Robots-Tag` de las privadas y la 404 sigue (CA8).
- **Navegador** (`scripts/probar-csp.mjs`, verificación en `/implement`):
  - las páginas públicas, la 404, "Ver mapa", el login con los dos botones de Google, y la
    navegación sin recargar de la portada a contacto y al login;
  - cero bloqueos de la CSP y los mismos elementos visibles.
  - Prueba de abuso en la misma herramienta: inyectar en una página un `<script src>` de otro origen
    y un `<iframe>` del sitio en una página ajena → el navegador los bloquea (CA3, CA4).
- **Paneles con sesión** (CA7): recorrido con la build local conectada al backend y la BD locales,
  con una cuenta de cada rol: Administrador, Asistente y Paciente. Incluye inicio, citas, historial,
  usuarios, servicios, promociones, galería, reportes y exportación, más el portal del paciente con
  su QR. Consola sin bloqueos.
- **Rendimiento y SEO** (RNF): `scripts/medir-rendimiento.mjs`, mediana de 5 frente a v1.4.1.

## Modelo de amenazas
La spec no cambia datos, autenticación ni permisos. Protege páginas que muestran datos de salud, así
que se modela igualmente.

| ID | Amenaza (STRIDE) | Categoría OWASP | Componente | Control | Test |
|---|---|---|---|---|---|
| TM1 | Manipulación: el sitio dentro de un marco ajeno para inducir clics (clickjacking) en el login o los paneles | A06:2025 Diseño inseguro | nginx, todas las páginas | `frame-ancestors 'none'` y `X-Frame-Options: DENY` | `seguridad-cabeceras.test.js`; `probar-nginx.mjs`; `probar-csp.mjs` (marco ajeno bloqueado) |
| TM2 | Elevación / divulgación: un script inyectado (XSS) roba el token de `localStorage` o datos de pacientes | A05:2025 Inyección | nginx (CSP), páginas | `script-src` solo `'self'` y `gsi/client`, sin código en línea ni `eval`; `object-src 'none'`; `base-uri 'self'` | `seguridad-cabeceras.test.js` (directivas); `probar-csp.mjs` (script ajeno bloqueado) |
| TM3 | Divulgación: un script inyectado envía datos a un dominio del atacante o abre un formulario falso hacia fuera | A05:2025 Inyección | CSP | `default-src`/`connect-src` solo `'self'` y `gsi/`; `form-action 'self'` | `seguridad-cabeceras.test.js` |
| TM4 | Manipulación / divulgación: degradar a HTTP en una red pública | A04:2025 Fallos criptográficos | nginx | HSTS de 180 días | `seguridad-cabeceras.test.js`; `probar-nginx.mjs` |
| TM5 | Divulgación: la URL de restablecer contraseña (`?token=…`) viaja como `Referer` a otro sitio | A04:2025 Fallos criptográficos | nginx | `Referrer-Policy: strict-origin-when-cross-origin` | `probar-nginx.mjs` sobre `/restablecer-contrasena?token=x` |
| TM6 | Manipulación: un archivo subido interpretado como otro tipo (MIME sniffing) | A02:2025 Configuración incorrecta | nginx; `/uploads/` (helmet) | `X-Content-Type-Options: nosniff` | `probar-nginx.mjs` |
| TM7 | Regresión: una versión futura quita o debilita una cabecera, o añade una `location` sin ellas | A02:2025 Configuración incorrecta | `nginx.conf` | Archivo único incluido en cada `location`; prueba de configuración y de contenedor en CI | `seguridad-cabeceras.test.js` (rompiendo cada regla) |

## Trazabilidad
| Criterio de aceptación | Cambio(s) | Test(s) |
|---|---|---|
| CA1: nosniff, referencia y permisos en toda respuesta | `nginx-seguridad.conf`, `nginx.conf` | `seguridad-cabeceras.test.js`; `probar-nginx.mjs` (todas las respuestas de la lista) |
| CA2: HSTS 6 meses sin subdominios | `nginx-seguridad.conf` | `seguridad-cabeceras.test.js` (valor exacto, sin `includeSubDomains` ni `preload`); `probar-nginx.mjs` · verificación manual: `curl -sI https://sistema.dentissa.app/` tras el despliegue (usuario, T097) |
| CA3 (abuso): sin marcos ajenos | `nginx-seguridad.conf` | `seguridad-cabeceras.test.js`; `probar-csp.mjs` (página ajena con un `iframe` del sitio → bloqueado) |
| CA4 (abuso): solo el sitio, Google Sign-In y el mapa | `nginx-seguridad.conf` | `seguridad-cabeceras.test.js` (orígenes exactos); `probar-csp.mjs` (script de otro origen → bloqueado); guardas de la 023 (`rendimiento-recursos`, hosts prohibidos) para "solo donde se usan" |
| CA5: Google Sign-In igual | — | `probar-csp.mjs` (los dos botones, sin bloqueos) · verificación manual: entrar con Google en producción (usuario, T097) |
| CA6: mapa igual | — | `probar-csp.mjs` ("Ver mapa" carga el marco, también llegando sin recargar) |
| CA7: todas las pantallas igual, sin bloqueos | — | `probar-csp.mjs` (públicas y login) · verificación manual: recorrido de los paneles con una cuenta de cada rol en local (Claude con cuentas de prueba o usuario), consola sin bloqueos |
| CA8: 404 y privadas con las mismas protecciones y su noindex | `nginx.conf` | `probar-nginx.mjs` |
| CA9: la comprobación automática falla si se quita o debilita | pruebas | `seguridad-cabeceras.test.js` (comprobado rompiendo cada regla); `probar-nginx.mjs` en CI |
| TM1: clickjacking | `nginx-seguridad.conf` | `seguridad-cabeceras.test.js`; `probar-nginx.mjs`; `probar-csp.mjs` (marco ajeno bloqueado) |
| TM2: script inyectado | CSP `script-src` | `seguridad-cabeceras.test.js`; `probar-csp.mjs` (script ajeno bloqueado) |
| TM3: envío de datos a otro dominio | CSP `default-src`, `connect-src`, `form-action` | `seguridad-cabeceras.test.js` |
| TM4: degradar a HTTP | HSTS | `seguridad-cabeceras.test.js`; `probar-nginx.mjs` |
| TM5: token de restablecimiento en el `Referer` | `Referrer-Policy` | `probar-nginx.mjs` (`/restablecer-contrasena?token=x`) |
| TM6: MIME sniffing | `X-Content-Type-Options` | `probar-nginx.mjs` |
| TM7: regresión de la configuración | archivo único e `include` | `seguridad-cabeceras.test.js` (rompiendo cada regla); `probar-nginx.mjs` en CI || RNF: rendimiento −2 como máximo, Prácticas recomendadas sin bajar, SEO 100 | — | `medir-rendimiento.mjs` (mediana de 5) frente a v1.4.1 |
| RNF: sin cambios visibles (P16) | — | verificación manual: capturas 390/1440 px de portada, contacto y login antes y después |

## Observabilidad
No aplica: no hay logs, eventos ni métricas nuevos. La CSP no envía informes (fuera de alcance).
- Cómo se verifica tras el despliegue:
  - `curl -sI` a la portada, `/login` y `/no-existe`;
  - la consola del navegador sin bloqueos en el login con Google y en contacto (usuario).

## Descubribilidad
No aplica: no se crean ni cambian rutas, títulos, descripciones, canónicas ni sitemap. Las cabeceras
nuevas no afectan a la indexación, y el `X-Robots-Tag` existente se conserva (CA8, P19).
Comprobación: Lighthouse SEO 100 (RNF).

## Rollout
- Feature flag: no aplica. Es configuración del servidor web; el interruptor es la imagen desplegada.
- Orden de despliegue: solo el frontend (`build --no-cache frontend` y `up -d frontend`); el backend
  no cambia.
- Compatibilidad: sin estado compartido; la versión anterior y la nueva sirven el mismo contenido.
- Rollback: `git checkout <commit anterior>` en el servidor y reconstruir el frontend, en unos
  minutos. **HSTS no se revierte:** los navegadores que lo recibieron exigen HTTPS durante 180 días.
  Es inocuo mientras el sitio siga en HTTPS detrás de Cloudflare.
- Métricas a vigilar tras el despliegue: la consola del navegador en el login con Google, en
  contacto y en un panel; el inicio de sesión con Google del usuario.

## Decisiones (→ ADR si son arquitectónicas)
- **Una sola CSP para todo el sitio** (decisión del usuario, 2026-11-19). El sitio navega sin
  recargar: una CSP por página bloquearía el mapa y Google al llegar navegando. Comprobado con una
  prueba de concepto el 2026-11-19: con una CSP única, "Ver mapa" funciona también al llegar desde
  la portada sin recargar.
- **Estilos en línea permitidos** (decisión del usuario, 2026-11-19). La prueba de concepto mostró
  bloqueos de `style-src-attr` (fotos de la portada y de nosotros) y de `style-src-elem` (Google
  Sign-In en el login). La alternativa con huellas exactas se rompería al cambiar Google su librería.
- **Archivo único incluido en cada `location`.** Frente a cabeceras en el `server` (anuladas por
  cualquier `add_header` de una `location`, 022/R22) o a `proxy_hide_header` en `/api/` (cambiaría las
  cabeceras de la API, fuera de alcance), es el único modo de cubrir todas las respuestas propias sin
  tocar las de Express. El riesgo de olvidar el `include` en una `location` nueva lo cubre la prueba
  de configuración.
- **Lo que nginx sirve y lo que no:** las cabeceras van en lo que sirve nginx; `/api/` y `/uploads/`
  quedan con helmet (spec, Fuera de alcance).
- **Prueba de concepto (2026-11-19):**
  - el build no tiene scripts en línea (salvo el JSON-LD, que es un dato y no se bloquea) ni
    `eval`/`new Function`;
  - con la CSP de la tabla, salvo `style-src 'unsafe-inline'` y `font-src data:`, los únicos
    bloqueos fueron esos dos, y los dos botones de Google y el mapa funcionaron.
- **`Referrer-Policy: strict-origin-when-cross-origin`** coincide con el valor por defecto de los
  navegadores actuales: no cambia lo que recibe Google Sign-In, que necesita el origen.
- Sin ADR: no hay dependencias ni cambios de arquitectura.
- Cobertura de RS6: RS6.a (cabeceras en el servidor web) y RS6.b (CSP compatible con Google
  Sign-In y las fuentes) dentro; se marcan mitigadas en `/release`.
- Línea base de dependencias (2026-11-19): solo GHSA-fc5q-39xc-vjpf (picomatch, desarrollo), con
  excepción vigente; `--omit=dev` sin altas.

## Riesgos y mitigaciones
- **Algo del panel que la prueba de concepto no cubrió** (pantallas con sesión, exportaciones): un
  bloqueo rompería esa función. Mitigación: recorrido con cada rol antes de liberar (CA7) y
  rollback en minutos.
- **Google cambia los orígenes de Sign-In:** el botón dejaría de cargar. Mitigación: los orígenes
  son los que Google documenta para CSP (`gsi/client`, `gsi/style`, `gsi/`); la verificación tras
  el despliegue incluye entrar con Google.
- **HSTS no se puede retirar** durante 180 días. Mitigación: sin `includeSubDomains` ni `preload`
  (decisión del usuario); el sitio ya solo funciona por HTTPS.
- **Una `location` nueva sin el `include`.** Mitigación: la prueba de configuración falla (TM7).

## Impacto en arquitectura
- `docs/architecture.md`: en la sección del frontend y nginx, las cabeceras de seguridad, el archivo
  `nginx-seguridad.conf` y la regla "un servicio externo nuevo exige actualizar la CSP y su prueba".
- `docs/security.md`: RS6 pasa a mitigado en `/release`.
