---
spec: 024-cabeceras-seguridad
verdict: approved
round: 2
date: 2026-11-22
base: de901ff
head: 2d175c7
human_signoff: RickssDev 2026-11-22 (revisó y fusionó el PR #86)
---

# Review · 024 Protecciones del navegador en todo el sitio

## Resumen
Ronda 2 sobre `de901ff..2d175c7`. Los tres importantes de la ronda 1 están resueltos: R1 y R2 en
el código, comprobados rompiendo lo que protegen, y R9 con una excepción vigente. Queda R15, un
fallo intermitente sin reproducir de `probar-csp.mjs`, que el usuario acepta con motivo, y un menor
nuevo (R16). Diff pequeño (8 KB): lo revisó la sesión principal releyendo los archivos, sin
subagentes (modo `--rerun`). La ronda 1, con los cuatro revisores independientes, está en
`history/review.r1.md`.
Conteo: bloqueante 0 · importante 1 (aceptado) · menor 1 (nuevo; los 11 menores de la ronda 1 siguen aceptados)

## Verificación automática
| Comando | Resultado |
|---|---|
| `npm test` | ✅ backend 256 (+5 todo), frontend 220; línea base: 0 fallos |
| `npm run lint --prefix backend` | ✅ 4 errores previos, ninguno en archivos de la spec |
| `npm run lint --prefix frontend` | ✅ 7 errores y 5 avisos previos, ninguno en archivos de la spec |
| `npm run build --prefix frontend` | ✅ |
| `node scripts/probar-nginx.mjs` (×2) | ✅ las dos pasan |
| `node scripts/probar-csp.mjs` (×2, con build y `--sin-build`) | ✅ las dos pasan |
| `aidd.py validate` | ✅ 0 errores |

## Criterios de aceptación
| CA | Test | Estado | Nota |
|---|---|---|---|
| CA1 | `tests/seguridad-cabeceras.test.js`, `scripts/probar-nginx.mjs` | ✅ | |
| CA2 | idem | ✅ | En producción, T097 |
| CA3 | idem + `probar-csp.mjs` | ✅ | |
| CA4 | `seguridad-cabeceras.test.js` + `probar-csp.mjs` | ✅ | |
| CA5 | `probar-csp.mjs` | ✅ | Google de verdad en producción, T097 |
| CA6 | `probar-csp.mjs` | ✅ | Sin `maps.google.com` en `frame-src`, falla con el bloqueo (T016); R16 |
| CA7 | `seguridad-recursos.test.js`, `probar-csp.mjs`, T023, T024 | ✅ | El detector se exige en cada página (R2) |
| CA8 | `probar-nginx.mjs` | ✅ | |
| CA9 | `seguridad-cabeceras.test.js` + `probar-nginx.mjs` | ✅ | El contenedor nombra la ruta, la cabecera, el valor esperado y el recibido, y las directivas que faltan (R1) |

## Conformidad con el plan
- Cambios fuera del plan: ninguno; `probar-nginx.mjs` y `probar-csp.mjs` los cubren T015 y T016.
- Partes del plan sin implementar: ninguna; T017 solo toca `docs/security.md`.

## Constitution Check (sobre el código)
| Principio | Resultado | Evidencia |
|---|---|---|
| P2 Tests por feature | ✅ | T015 y T016 comprobados rompiendo lo que protegen |
| P10 Secretos | ✅ | gitleaks sin hallazgos |
| P11 Vulnerabilidades | ✅ | SCA sin altas; trivy: AVD-DS-0002 con excepción vigente hasta 2026-12-31 (`docs/security.md:70`) |
| Resto | ✅ / ➖ | Sin cambios respecto a la ronda 1 (`history/review.r1.md`) |

## Seguridad
| Herramienta | Resultado |
|---|---|
| gitleaks (diff `a608beb..HEAD`) | ✅ 0 hallazgos |
| SAST | ➖ no aplica |
| SCA (`npm audit --audit-level=high`) | crít: 0 · alta: 0 · media: 2 (backend, `uuid`, previas) |
| trivy fs | 1 alta AVD-DS-0002, previa, con excepción vigente (R9) |

| Tema OWASP (Top 10:2025) | Resultado | Evidencia |
|---|---|---|
| A02/A05/A06 Cabeceras y CSP | ✅ | Sin cambios en `nginx-seguridad.conf` ni `nginx.conf` en esta ronda |
| A02 Contenedor no root | ➖ excepción | `docs/security.md:70`, vence 2026-12-31 |

## Observabilidad
- Eventos de auditoría de la spec emitidos y probados: no aplica.
- Datos sensibles en logs del código tocado: ninguno.
- `request_id` presente en los logs nuevos: no aplica.

## SEO
| Tema | Resultado | Evidencia |
|---|---|---|
| Estados, `noindex`, canónicas, renderizado | ✅ | Sin cambios en el sitio servido en esta ronda; `probar-nginx.mjs` en verde (ronda 1: `history/review.r1.md`) |
- Sección "Descubribilidad" del plan aplicada: sí.

## Hallazgos
| ID | Severidad | Archivo:línea | Hallazgo | Sugerencia |
|---|---|---|---|---|
| R1 | importante | `frontend/scripts/probar-nginx.mjs:82-90, 109-119` | **Corregido** (T015): seis nombres y 11 directivas fijos, valores del archivo; cada fallo nombra la ruta y la protección | — |
| R2 | importante | `frontend/scripts/probar-csp.mjs:26, 30-34, 49, 57-60` | **Corregido** (T016): rechaza con `m.error`, falla si la página lanza, exige el detector y nombra el paso que no se completa | — |
| R9 | importante | `frontend/Dockerfile:26-37` | **Aceptado como excepción** (T017): `docs/security.md:70`, vence 2026-12-31 | Ficha `/chore` con imagen no root y versiones fijas |
| R15 | importante | `frontend/scripts/probar-csp.mjs` | Un fallo intermitente sin causa conocida durante `/implement` (1 de 12 pasadas, solo con la última línea de la traza); no se reprodujo en 13 pasadas más, incluidas las dos de esta ronda | Aceptado por el usuario: si vuelve en `/release`, investigarlo con el mensaje que ahora da el script |
| R16 | menor | `frontend/scripts/probar-csp.mjs` (`verMapa`) | La comprobación del mapa solo mira que exista el `iframe`: con el mapa bloqueado da `mapa=true` (la prueba falla igual por el bloqueo) | Comprobar en la sesión del marco que su documento no es `chrome-error://`, como en el abuso del iframe |

## Preparación para release
- Rollback factible: sí; se reconstruye la imagen anterior del frontend. HSTS no se revierte durante 1 año (documentado).
- Migraciones compatibles con la versión anterior: no hay migraciones ni feature flags.
- Docs actualizadas (architecture, deployment): sí (T090, T091); excepción en `security.md` (T017).
- SCA: sin críticas ni altas. Contenedores: la alta previa tiene excepción vigente.
- Riesgos: RS6.a y RS6.b siguen "pendiente"; las marca `/release`.
- Para `/release`: comprobar en producción que no hay imágenes con URL absoluta de otro dominio (R13), y correr `probar-csp.mjs` como verificación manual de la versión (R12, R15).

## Tareas añadidas
- T015 ← R1 (ronda 1)
- T016 ← R2 (ronda 1)
- T017 ← R9 (ronda 1)

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
- **R15** → roadmap: fallo intermitente sin reproducir de `probar-csp.mjs` (1 de 12); investigar si se repite
- **R16** → roadmap: la comprobación del mapa en `probar-csp.mjs` debe mirar el documento del marco, no solo que exista el `iframe`
