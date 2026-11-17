---
spec: 023-rendimiento-sitio
verdict: changes_requested
round: 1
date: 2026-11-17
base: 5f33c0c
head: 52ea25a
human_signoff: pending
---

# Review · 023 Rendimiento del sitio público y el login

## Resumen
Los objetivos de rendimiento se cumplen. En Lighthouse móvil (mediana de 5, equipo libre):
- galería, contacto, aviso y términos: 100;
- portada: 97;
- login: 99 y nosotros: 97, aceptados por el usuario.

CLS ≤ 0,005, SEO 100 y sin servicios externos al cargar. Aun así hay dos bloqueantes:
- **R1:** el anillo de foco del mapa queda recortado y no se ve (WCAG 2.4.7);
- **R2:** el CSS nuevo del bloque usa medidas literales, contra P20.

Hay además ocho importantes: el aviso de picomatch rompe el CI, y faltan detalles de accesibilidad y de pruebas. El usuario decide corregir los bloqueantes, los importantes y los menores baratos, y registrar la excepción de picomatch.

Conteo: bloqueante 2 · importante 8 · menor 26. Descartados al verificar: 2 (ver al final).

## Verificación automática
| Comando | Resultado |
|---|---|
| `npm test` | ✅ backend 256 + 5 `todo`; frontend 173 (21 archivos) |
| `npx eslint` (archivos tocados) | ✅ 0 errores; total del frontend 12 (13 previos) |
| `npm run build` | ✅ prerender de las seis páginas, login, 404, `app.html`, robots y sitemap, con todas las guardas activas |
| `node scripts/probar-nginx.mjs` | ✅ 29/29 (CI "Lint y build" en verde) |
| `aidd.py validate` | ✅ 0 errores |
| CI "Seguridad (solo cambios del PR)" | ❌ `npm audit --audit-level=high`: picomatch ≤ 4.0.7 (R3) |

## Criterios de aceptación
| CA | Test | Estado | Nota |
|---|---|---|---|
| CA1 | `medir-rendimiento.mjs` (manual) | ✅ | 100 ×4, portada 97; login 99 y nosotros 97 aceptados por el usuario (Decisiones de la spec) |
| CA2 | `medir-rendimiento.mjs`, `seo-prerender` | ✅ | LCP ≤ 2,5 s salvo nosotros (2,5–2,6 s, aceptado); CLS ≤ 0,005 |
| CA3 | `seo-prerender`, `smartimage-prioridad` | ✅ | |
| CA4 | `rendimiento-guardas` y la guarda del build | ✅ | |
| CA5 | `rendimiento-carga`, `seo-hidratacion` | ⚠ | Un caso no puede fallar (R8). Hay un proveedor por botón al cambiar de panel (R9) |
| CA6 | `rendimiento-mapa`, `rendimiento-estilos` | ⚠ | Foco no visible (R1); "Cómo llegar" mide 38 px con el mapa cargado (R4) y su contraste al pasar el ratón es 3,96:1 (R5) |
| CA7 | `rendimiento-recursos`, guarda de hosts | ✅ | |
| CA8 | `rendimiento-recursos`, guarda de hosts | ✅ | |
| CA9 | suites de la 022, hidratación, capturas | ⚠ | Título del login al salir (R7); aviso de la galería (R6) |
| CA10 | `probar-nginx` | ✅ | |

## Conformidad con el plan
- Cambios fuera del plan: `backend/tests/seguridad/dependencias-produccion.json` (control P3 de la 018, registrado en una nota de T001; R35).
- Partes del plan sin implementar: ninguna. `plan.md:206` contradice la decisión posterior de precargar (R19).

## Constitution Check (sobre el código)
| Principio | Resultado | Evidencia |
|---|---|---|
| P2 Tests | ⚠ | R8 y R10: pruebas que no fallarían con lo protegido roto |
| P3 Dependencias con ADR | ✅ | ADR 0010; lista de la 018 actualizada |
| P11 Vulnerabilidades | ❌ → excepción | picomatch alto en dependencias de desarrollo (R3); excepción aprobada por el usuario |
| P16 WCAG AA | ❌ | R1 (2.4.7), R5 (1.4.3), R6 (4.1.3), R7 (2.4.2) |
| P20 Sistema de diseño | ❌ | R2: literales de espaciado y tipografía en `Contact.css` |
| Resto | ✅ / ➖ | Como en el plan |

## Seguridad
| Herramienta | Resultado |
|---|---|
| gitleaks (`origin/main..HEAD`) | ✅ sin hallazgos |
| SCA `npm audit --audit-level=high` | ❌ frontend 5 altas · backend 36 altas, todas por picomatch ≤ 4.0.7 (GHSA-fc5q-39xc-vjpf) en dependencias de desarrollo y build; backend `--omit=dev`: 0 altas |

| Tema OWASP (2025) | Resultado | Evidencia |
|---|---|---|
| A01 Control de acceso | ➖ | Sin endpoints ni permisos nuevos |
| A02 Configuración incorrecta | ⚠ | Sin cabeceras de seguridad, previo (R24); gzip de JSON de la API (R21) |
| A03 Cadena de suministro | ⚠ | picomatch sin parche (R3); la dependencia nueva está verificada (ADR 0010) |
| A04 Fallos criptográficos / datos | ✅ | TM1: `datosDeSesion` en el build, con test real |
| Secretos | ✅ | El client ID es público y nunca se imprime |

## Observabilidad
- Sin eventos de auditoría ni logs nuevos (no aplica). Sin datos sensibles en los logs del código tocado. El mensaje de la guarda TM1 imprime 12 caracteres del dato encontrado (R22).

## SEO
| Tema | Resultado | Evidencia |
|---|---|---|
| Indexación y canónica | ✅ | `login.html` con `noindex`, sin canónica ni OG y fuera del sitemap; públicas sin cambios |
| Contenido sin JS | ✅ | `<h1>` en `main`, foto principal visible, contacto sin `iframe` |
| Precargas | ✅ | Fuente y foto tras el `viewport`, bien formadas, una sola descarga |
| Recursos externos | ✅ | Ninguno en las siete páginas |
- "Descubribilidad" del plan aplicada: sí. La guarda del build no comprueba "sin OG" en `login.html` (R17).

## Hallazgos
| ID | Severidad | Archivo:línea | Hallazgo | Sugerencia |
|---|---|---|---|---|
| R1 | bloqueante | frontend/src/styles/home/Contact.css:189 · Contact.jsx:85 | El foco pasa al `iframe`, pero el contorno global (`outline-offset: 3px`) queda recortado por `.map { overflow: hidden }`: no se ve (WCAG 2.4.7) | Anillo hacia dentro en `.map iframe:focus-visible`; test sobre el CSS y captura |
| R2 | bloqueante | frontend/src/styles/home/Contact.css:206-251 | P20: literales de espaciado y tipografía (`10px`, `24px`, `52px`, `14px`, `12px`, `6px`) en reglas nuevas; el sistema no tiene esa escala | Añadir al sistema los tokens necesarios (decisión del usuario) y usarlos |
| R3 | importante | frontend/package-lock.json · CI | El job de seguridad falla: picomatch ≤ 4.0.7 alto, sin versión corregida; solo desarrollo y build | Excepción en `docs/security.md` (decisión del usuario) |
| R4 | importante | frontend/src/pages/Contact.jsx:115 | "Cómo llegar" con el mapa cargado usa `dt-btn--sm` (38 px) | Sin `--sm`, 46 px como en la vista previa |
| R5 | importante | frontend/src/styles/home/Contact.css:245 (global.css:190) | Al pasar el ratón, "Cómo llegar" pasa a texto `--primary` sobre blanco, 3,96:1 | `.map__llegar:hover` con `--primary-700` |
| R6 | importante | frontend/src/pages/Gallery.jsx:116 | El aviso de error o vacía no se anuncia (sin `role`) y tras "Reintentar" el foco cae al `body` | `role="status"` en el aviso y foco a un elemento estable tras reintentar |
| R7 | importante | frontend/src/pages/admin/login.jsx:179-181 | El login no restaura el título al desmontarse: en el panel queda "Iniciar sesión \| Dentissa" (WCAG 2.4.2) | Limpieza del efecto con `TITULO_GENERAL` y test |
| R8 | importante | frontend/tests/rendimiento-carga.test.jsx:37-46 | El caso "no inserta script de Google" no puede fallar: el mock nunca inserta scripts | Mock del proveedor que inserte el `<script>` al montarse |
| R9 | importante | frontend/src/pages/admin/login.jsx:117-118 | Un `GoogleOAuthProvider` por botón: al cambiar de panel se desmonta y se vuelve a cargar el script de Google; sin test | Un solo proveedor en `Login`, condicionado por el pintado, que envuelva los dos botones; test de cambio de panel |
| R10 | importante | frontend/tests/rendimiento-estilos.test.js:91-97 | La prueba de P20 solo revisa colores: no fallaría con literales de medida | Ampliarla a longitudes y `font-size` |
| R11 | menor | frontend/src/App.jsx:15 | Con el almacenamiento bloqueado, `sessionStorage` lanza un error y una carga correcta se rechaza | `try/catch` en `almacen()` |
| R12 | menor | frontend/tests/rendimiento-carga.test.jsx:47-70 | No se prueba que una carga correcta borra la marca de recarga | Caso falla → recarga → bien → falla → recarga |
| R13 | menor | frontend/src/App.jsx:49-52 | Las páginas públicas `lazy` no pasan por `cargarPagina` | Roadmap |
| R14 | menor | frontend/src/App.jsx:28 | `cargarPagina` vive en el archivo de componentes con `eslint-disable` | Roadmap (`src/utils/`) |
| R15 | menor | frontend/src/pages/admin/login.jsx:90-91 | `clearTimeout` con un id de `requestIdleCallback` (espacios distintos) | Cancelar solo con la API usada |
| R16 | menor | frontend/scripts/prerender.mjs:58-73 | Si la foto deja de llevar `fetchPriority="high"`, la precarga desaparece sin aviso | Exigirla en `/` y `/nosotros` |
| R17 | menor | frontend/scripts/prerender.mjs:111-116 | La guarda de `login.html` no comprueba "sin Open Graph" | Añadirlo |
| R18 | menor | docs/seo.md:16-24, 106 | Reglas e inventario con el estado de antes de la 022; la exclusión dice que `/login` usa `app.html` | Ponerlos al día |
| R19 | menor | docs/specs/023-rendimiento-sitio/plan.md:206 | "Sin `preload` adicional" contradice T034/T035 | Corregir |
| R20 | menor | frontend/nginx.conf:15 | `gzip_types` sin `text/javascript` (nginx está migrando) | Añadirlo |
| R21 | menor | frontend/nginx.conf:15 | `application/json` comprime también las respuestas de la API (BREACH teórico) | Quitarlo |
| R22 | menor | frontend/scripts/prerender.mjs:115 | La guarda TM1 imprime 12 caracteres del dato encontrado | Imprimir solo el tipo |
| R23 | menor | plan.md (TM1) | TM1 mapeada a A05:2021; la edición vigente es 2025 (A02); el texto promete "valores del entorno" que la guarda no cubre | Corregir el mapeo y el texto |
| R24 | menor | frontend/nginx.conf, Caddyfile | Sin cabeceras de seguridad (CSP, `frame-ancestors`…); previo | Roadmap (riesgo RS nuevo) |
| R25 | menor | html/login.html | Sin `<main>` y con dos `h1` (registro e inicio) | Roadmap |
| R26 | menor | frontend/src/App.jsx:46 | El respaldo `Cargando página...` sin `role="status"` | Roadmap |
| R27 | menor | frontend/src/pages/Gallery.jsx:189 | Esqueleto sin `aria-busy` ni texto accesible (previo) | Roadmap |
| R28 | menor | frontend/src/pages/Contact.jsx:97 | "Cómo llegar" abre otra pestaña sin avisar | Roadmap |
| R29 | menor | frontend/src/styles/home/Contact.css:237 | "Ver mapa" usa `--bg` como color de texto | Roadmap |
| R30 | menor | frontend/scripts/medir-rendimiento.mjs, capturas.mjs | Robustez: comillas en `--chrome-flags` sin shell, `catch` mudo, espera sin límite, duplicación, `shell: true`, puerto CDP fijo | Roadmap |
| R31 | menor | frontend/tests/rendimiento-mapa.test.jsx:23 | K2 compara clases y no reglas CSS de `.map.is-activo` | Cubierto por la ampliación de R10 |
| R32 | menor | frontend/scripts/prerender.mjs:88 | La guarda de hosts solo mira HTML, no CSS ni JS | Roadmap |
| R33 | menor | frontend/src/seo/guardas.js:25 | `cierreEstatico` da por hecho la clave `index.html` | Roadmap |
| R34 | menor | html/login.html:11 | `login.html` hereda la descripción de la portada | Roadmap |
| R35 | menor | tasks.md T001 | `dependencias-produccion.json` no figura en las rutas de T001 | Nota en T001 |
| R36 | menor | plan.md:30 | CA1 y CA2 solo se miden a mano | Aceptado (Lighthouse varía; plan) |

Descartados al verificar:
- Recorte del bloque del mapa entre 641 y 900 px: `.map` tiene `min-height: 320px`, que cubre el contenido.
- Doble descarga por las dos precargas de imagen: comprobado en Chrome, se descarga una sola vez.

## Preparación para release
- Rollback factible: sí (reconstruir el frontend del commit anterior); sin datos ni migraciones.
- Docs: `architecture.md` y `seo.md` actualizadas (T090); `seo.md` necesita ponerse al día (R18).
- SCA: excepción de picomatch pendiente de registrar (R3, T047).

## Tareas añadidas
Decisión del usuario (2026-11-17): corregir bloqueantes, importantes y menores baratos; tokens nuevos para P20; excepción de picomatch.
- T036 ← R1, R2, R4, R5, R10, R31
- T037 ← R2
- T038 ← R1, R2, R4, R5
- T039 ← R6
- T040 ← R6
- T041 ← R7, R8, R9, R11, R12
- T042 ← R7, R9, R11, R15
- T043 ← R20, R21
- T044 ← R20, R21
- T045 ← R16, R17, R22
- T046 ← R18, R19, R23, R35
- T047 ← R3

## Aceptados sin tarea
- **R13** → roadmap: las páginas públicas `lazy` sin `cargarPagina`
- **R14** → roadmap: mover `cargarPagina` a `src/utils/`
- **R24** → roadmap: cabeceras de seguridad (CSP, `frame-ancestors`, `X-Content-Type-Options`, `Referrer-Policy`) en nginx/Caddy
- **R25** → roadmap: `login.html` sin `<main>` y con dos `h1`
- **R26** → roadmap: respaldo de `Suspense` sin `role="status"`
- **R27** → roadmap: esqueleto de la galería sin `aria-busy`
- **R28** → roadmap: aviso de "se abre en otra pestaña" en "Cómo llegar"
- **R29** → roadmap: token de texto sobre acción principal en lugar de `--bg`
- **R30** → roadmap: robustez de `medir-rendimiento.mjs` y `capturas.mjs`
- **R32** → roadmap: guarda de hosts sobre CSS y JS de `dist/assets`
- **R33** → roadmap: `cierreEstatico` sin la clave `index.html`
- **R34** → roadmap: descripción propia de `login.html`
- **R36** → roadmap: CA1/CA2 sin comprobación automática (presupuesto de bytes por ruta)
