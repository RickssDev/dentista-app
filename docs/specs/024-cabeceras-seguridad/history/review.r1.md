---
spec: 024-cabeceras-seguridad
verdict: changes_requested
round: 1
date: 2026-11-22
base: a608beb
head: de901ff
human_signoff: no requerido
---

# Review · 024 Protecciones del navegador en todo el sitio

## Resumen
Las cabeceras y la CSP cumplen los criterios: los tests pasan, el navegador no registra bloqueos y
los dos abusos quedan bloqueados. Se piden cambios por dos importantes en las comprobaciones
automáticas. La de CI no dice qué protección falla (CA9), y la del navegador podría dar "cero
bloqueos" sin estar mirando. Además, el hallazgo alto de trivy en el `Dockerfile` (previo a la
spec) necesita una excepción para poder liberar.
Conteo: bloqueante 0 · importante 3 · menor 11

## Verificación automática
| Comando | Resultado |
|---|---|
| `npm test` | ✅ backend 256 (+5 todo), frontend 220; línea base: 0 fallos |
| `npm run lint --prefix backend` | ✅ 4 errores previos, ninguno en archivos de la spec (línea base: 5) |
| `npm run lint --prefix frontend` | ✅ 7 errores y 5 avisos previos en 8 archivos, ninguno de la spec (línea base: 10) |
| `npm run build --prefix frontend` | ✅ prerender de 6 páginas públicas, login, 404, `app.html`, `robots.txt` y `sitemap.xml` |
| `node scripts/probar-nginx.mjs` (×2) | ✅ las dos pasan |
| `node scripts/probar-csp.mjs` (×2, con build y `--sin-build`) | ✅ las dos sin bloqueos y con los abusos bloqueados |
| `aidd.py validate` | ✅ 0 errores |

## Criterios de aceptación
| CA | Test | Estado | Nota |
|---|---|---|---|
| CA1 | `tests/seguridad-cabeceras.test.js`, `scripts/probar-nginx.mjs` | ✅ | Las 12 `location` propias incluyen el archivo y llevan `always`. Las 5xx que genera nginx en `/api/` y `/uploads/` salen sin cabeceras (R6) |
| CA2 | idem | ✅ | HSTS `max-age=31536000` exacto; en producción, T097 |
| CA3 | idem + `probar-csp.mjs` (abuso del iframe) | ✅ | La página ajena se sirve desde un servidor propio sin CSP; el marco termina en `chrome-error://` |
| CA4 | `seguridad-cabeceras.test.js` (directivas) + `probar-csp.mjs` (`<script src>`) | ✅ | En el navegador solo se prueba el script (R12) |
| CA5 | `probar-csp.mjs` (dos botones, directo y sin recargar) | ✅ | Google de verdad en producción, T097 |
| CA6 | `probar-csp.mjs` (mapa, directo y sin recargar) | ✅ | |
| CA7 | `seguridad-recursos.test.js`, `probar-csp.mjs`, T023 (27/27), T024 | ✅ | La detección de bloqueos por página no se ha visto fallar (R2) |
| CA8 | `probar-nginx.mjs` (`noindex` en `/login`, privadas y 404) | ✅ | |
| CA9 | `seguridad-cabeceras.test.js` + `probar-nginx.mjs` | ⚠ | Falla, pero la comprobación del contenedor no dice qué protección (R1) |

## Conformidad con el plan
- Cambios fuera del plan: ninguno. `capturas.mjs` y `medir-rendimiento.mjs` los cubre T014, añadida durante `/implement` con aprobación.
- Partes del plan sin implementar: ninguna. T001, T023 y T024 no tienen diff porque dejan mediciones en `.ai/inspect/`, que está ignorado.

## Constitution Check (sobre el código)
| Principio | Resultado | Evidencia |
|---|---|---|
| P1 Spec antes de implementar | ✅ | Spec, plan y tareas aprobados; `analysis.md` pass |
| P2 Tests por feature | ✅ | T010, T011, T013 antes de T020, T021 y T025; T012 antes de T022 |
| P3 Dependencias con ADR | ➖ | Sin dependencias nuevas (`deps.stat` vacío) |
| P4 Arquitectura con ADR | ✅ | Sin cambio de arquitectura; `architecture.md` documenta la regla de la CSP (T090) |
| P5/P6 Producción y rollback | ✅ | Rollback = reconstruir la imagen anterior; HSTS no se revierte (documentado) |
| P10 Secretos | ✅ | gitleaks sin hallazgos; si falla `docker build`, el error no muestra el client ID |
| P11 Vulnerabilidades | ⚠ | SCA sin altas; trivy: 1 alta previa en el contenedor (R9) |
| P12 Modelo de amenazas | ✅ | TM1–TM7 con su control y su test |
| P16 Sin cambios visibles | ✅ | Capturas antes y después iguales (T022, confirmado por el usuario) |
| P18/P19 Metadatos y noindex | ✅ | Suite de la 022 en verde; `X-Robots-Tag` y `meta noindex` conservados |
| P7–P9, P13–P15, P17, P20 | ➖ | Sin esquema, endpoints, datos sensibles, vistas ni estilos |

## Seguridad
| Herramienta | Resultado |
|---|---|
| gitleaks (diff `a608beb..HEAD`) | ✅ 0 hallazgos |
| SAST | ➖ no aplica (decisión del usuario, `docs/security.md`) |
| SCA (`npm audit --audit-level=high`) | crít: 0 · alta: 0 · media: 2 (backend, `uuid`, previas) |
| trivy fs (vuln, misconfig) | 1 alta: AVD-DS-0002, `frontend/Dockerfile` sin `USER` (previo; R9) |

| Tema OWASP (Top 10:2025) | Resultado | Evidencia |
|---|---|---|
| A05 Inyección: CSP `script-src` | ✅ | `nginx-seguridad.conf`: `'self'` + `gsi/client`, sin `unsafe-inline` ni `unsafe-eval`; probado en el test y en el navegador |
| A05 `style-src 'unsafe-inline'` | ✅ riesgo aceptado | Decisión del plan (Google Sign-In y atributos `style`) |
| A05 `object-src`, `base-uri`, `form-action`, `connect-src` | ✅ | Valores exactos en el test |
| A06 Antimarcos | ✅ | `frame-ancestors 'none'` + `X-Frame-Options: DENY`; abuso bloqueado en el navegador |
| A04 HSTS y `Referrer-Policy` | ✅ | Valores exactos en el archivo y en el contenedor |
| A02 `nosniff`, `Permissions-Policy`, herencia de `add_header` | ✅ | Todas las `location` propias incluyen el archivo; la 301 y la 404 llevan las cabeceras |
| A02 Respuestas 5xx de nginx | ➖ | R6 |
| A02 Contenedor no root | ❌ previo | R9 |
| A03 Cadena de suministro | ✅ | Sin dependencias nuevas; imágenes base sin versión fija (previo; R9) |
| Proceso: rutas protegidas | ✅ | Solo `9e0af3d` (T021) toca `nginx.conf` y `Dockerfile` |
| Proceso: instrucciones a agentes | ✅ | Ninguna en el diff |

## Observabilidad
- Eventos de auditoría de la spec emitidos y probados: no aplica (sin eventos nuevos).
- Datos sensibles en logs del código tocado: ninguno; los scripts no imprimen el client ID.
- `request_id` presente en los logs nuevos: no aplica (sin logs nuevos en la aplicación).

## SEO
| Tema | Resultado | Evidencia |
|---|---|---|
| Códigos de estado | ✅ | Respuestas del contenedor: `/` 200, `/no-existe` 404, `/nosotros/` 301 a `/nosotros` |
| `noindex` | ✅ | `/login` y `/admin/usuarios`: `X-Robots-Tag: noindex` + meta; 404 con meta `noindex`; las seis indexables sin `noindex` |
| Canónicas, sitemap y robots | ✅ | `dist/`: seis canónicas sin barra final, `sitemap.xml` con las seis URL, `robots.txt` con `Allow: /` |
| Renderizado con la CSP | ✅ | Scripts, estilos, fuentes e imágenes propios; mapa y Google Sign-In cubiertos por la CSP |
- Sección "Descubribilidad" del plan aplicada: sí. El SEO 100 de las seis indexables lo mide T024.

## Hallazgos
| ID | Severidad | Archivo:línea | Hallazgo | Sugerencia |
|---|---|---|---|---|
| R1 | importante | `frontend/scripts/probar-nginx.mjs:111-123` | CA9 pide indicar qué protección falla y en qué respuesta. La comprobación del contenedor une 7 condiciones en un `&&` y solo imprime "✘ ruta → cabeceras de seguridad". Además, de la CSP solo mira `frame-ancestors` y `script-src`. | Listar cabecera, valor esperado y valor recibido, y comparar la CSP completa con la de `nginx-seguridad.conf` |
| R2 | importante | `frontend/scripts/probar-csp.mjs:86, 106` | El cliente CDP ignora `m.error`. Si fallara `addScriptToEvaluateOnNewDocument`, el detector de violaciones no se instalaría y el script diría "cero bloqueos". Nunca se ha comprobado que detecte un bloqueo real en una página. | Rechazar con `m.error`. Comprobar rompiendo la CSP (sin `maps.google.com` en `frame-src`) que `/contacto` informa el bloqueo |
| R9 | importante | `frontend/Dockerfile:26-37` | trivy AVD-DS-0002 (alta): la imagen no declara `USER` y el maestro de nginx corre como root. Es previo a la spec (la base tampoco lo tenía); los workers ya corren como `nginx`. `/release` se bloquea con una alta sin excepción. | Excepción con vencimiento en `docs/security.md` y ficha `/chore` aparte: imagen no root y `nginx` y `node` con versión fija |
| R3 | menor | `frontend/scripts/probar-csp.mjs` (cliente CDP), `capturas.mjs`, `medir-rendimiento.mjs` | Se repiten el cliente CDP y los helpers (`docker`, `esperar`, `clientId`, build sin mostrar el ID) | Extraer `scripts/lib/` |
| R4 | menor | `frontend/scripts/probar-csp.mjs` (constante `CHROME`) | Solo la ruta de Chrome de Windows y la variable `CHROME`; `capturas.mjs` usa `CHROME_PATH` y busca en varias rutas | Unificar |
| R5 | menor | `frontend/scripts/probar-csp.mjs` (abuso del iframe y `finally`) | Si no se crea el marco se informan dos fallos, el segundo engañoso. El servidor ajeno, el `ws` y el perfil temporal de Chrome no se limpian en `finally`. | `else` y limpieza en `finally` |
| R6 | menor | `frontend/nginx.conf:24-36` | Las 502/503/504 que genera nginx en `/api/` y `/uploads/` (backend caído) salen sin cabeceras de seguridad. Son páginas estáticas sin datos. | `error_page 502 503 504` hacia una `location` interna que incluya el archivo, o anotarlo como brecha |
| R7 | menor | `frontend/nginx-seguridad.conf` (`frame-src`) | `https://www.google.com` permite incrustar cualquier ruta de ese dominio | Restringir a la ruta del mapa tras comprobar su redirección |
| R8 | menor | `frontend/tests/seguridad-recursos.test.js:45-47` | `permitida` compara por origen contra todas las directivas juntas y con `startsWith` sin límite de origen | Asociar cada origen a su directiva y comparar por `origin` |
| R10 | menor | `frontend/tests/seguridad-recursos.test.js` (respaldo `CSP_DEL_PLAN`, test de `createObjectURL`, `getImageUrl` por regex) | Si falta el archivo de la CSP, usa en silencio la del plan. El nombre del test de `blob:` no corresponde con lo que comprueba. El marcador se prueba leyendo el texto de `api.js` y no llamando a `getImageUrl`. | Fallar si falta el archivo; renombrar; importar `getImageUrl` |
| R11 | menor | `frontend/tests/seguridad-cabeceras.test.js:55` | El parser de `location` no admite bloques anidados: una `location` anidada futura sin el `include` pasaría | Fallar si un cuerpo contiene `{` o `location` |
| R12 | menor | `frontend/scripts/probar-csp.mjs` (abusos) | CA4 menciona script, marco o recurso, pero en el navegador solo se prueba el `<script src>`. `probar-csp` no corre en CI: es una verificación manual por versión. | Añadir un abuso de `fetch` o `img`; dejarlo en la verificación de `/release` |
| R13 | menor | `frontend/src/services/api.js:135` | Una imagen guardada con URL absoluta de otro dominio dejaría de verse (`img-src 'self'`). En local no hay ninguna; producción sin comprobar. | Consulta de solo lectura en producción antes de liberar (`/release`) |
| R14 | menor | `frontend/nginx-seguridad.conf:24` | El comentario dice que el HSTS es "como la API", pero helmet manda `includeSubDomains` en `/api/` | Corregir el comentario o fijar el valor en helmet |

## Preparación para release
- Rollback factible: sí; se reconstruye la imagen anterior del frontend en unos minutos. HSTS no se revierte durante 1 año y es inocuo mientras el sitio siga en HTTPS.
- Migraciones compatibles con la versión anterior: no hay migraciones ni feature flags (el plan no los pide).
- Docs actualizadas (architecture, deployment): sí (T090: regla de la CSP; T091: verificación post-deploy con `curl -sI` y la consola).
- Riesgos: RS6.a y RS6.b siguen "pendiente" en `docs/security.md`; las marca `/release`.
- SCA: sin críticas ni altas. Contenedores: una alta previa, que necesita la excepción de T017 para liberar.

## Tareas añadidas
- T015 ← R1
- T016 ← R2
- T017 ← R9

## Aceptados sin tarea
- **R3** → roadmap: extraer a `frontend/scripts/lib/` el cliente CDP y los helpers repetidos de los scripts de medición y comprobación
- **R4** → roadmap: unificar la ruta de Chrome (`CHROME_PATH` y búsqueda) en `probar-csp.mjs`
- **R5** → roadmap: `probar-csp.mjs`, un solo fallo si no se crea el marco y limpieza de servidor, `ws` y perfil en `finally`
- **R6** → roadmap: cabeceras de seguridad en las 502/503/504 que genera nginx en `/api/` y `/uploads/`
- **R7** → roadmap: restringir `frame-src https://www.google.com` a la ruta del mapa
- **R8** → roadmap: guarda de recursos por directiva y por `origin` en `seguridad-recursos.test.js`
- **R10** → roadmap: `seguridad-recursos.test.js` sin respaldo del plan, nombre del test de `blob:` y `getImageUrl` importada
- **R11** → roadmap: el parser de `location` debe rechazar bloques anidados en `seguridad-cabeceras.test.js`
- **R12** → roadmap: abuso de `fetch` o `img` en `probar-csp.mjs`; el script es una verificación manual por versión
- **R13** → roadmap: comprobar en producción que no hay imágenes con URL absoluta de otro dominio (en `/release`)
- **R14** → roadmap: comentario del HSTS frente a helmet (`includeSubDomains` en `/api/`)
