---
spec: 025-frontend-sin-root
verdict: approved
round: 2
date: 2026-11-23
base: f9732c3
head: 18e0294
human_signoff: RickssDev 2026-11-23 (revisó y fusionó el PR #91)
---

# Review · 025 Servicio del sitio sin privilegios de administrador

## Resumen
Ronda 2 sobre `f9732c3..18e0294`: los dos importantes de la ronda 1 están corregidos y
comprobados rompiendo lo que protegen. R1: las comprobaciones dentro del contenedor tienen un
control positivo y exigen el motivo del rechazo. R2: el reenvío a `/api/` con un cuerpo que pasa
por `client_temp` se prueba. No hay hallazgos nuevos. Diff pequeño (6,8 KB, un archivo): lo revisó
la sesión principal releyendo el diff, sin subagentes (modo `--rerun`). La ronda 1, con tres
revisores independientes, está en `history/review.r1.md`.
Conteo: bloqueante 0 · importante 0 · menor 0 nuevos (los 11 menores de la ronda 1 siguen aceptados)

## Verificación automática
| Comando | Resultado |
|---|---|
| `npm test` | ✅ backend 256 (+5 todo), frontend 224 |
| lint | ✅ errores previos, ninguno en archivos de la spec |
| `npm run build --prefix frontend` | ✅ |
| `node scripts/probar-nginx.mjs` (×2) | ✅ las dos pasan (incluye `/api/` con 64 KB y el control positivo) |
| `aidd.py validate` | ✅ 0 errores |

## Criterios de aceptación
| CA | Test | Estado | Nota |
|---|---|---|---|
| CA1 | `imagen-contenedor.test.js`, `probar-nginx.mjs` (procesos con control y código de `ps`) | ✅ | R1 corregido |
| CA2 | `probar-nginx.mjs` (respuestas, cabeceras y `/api/` con cuerpo en `client_temp`) | ✅ | R2 corregido |
| CA3 | `probar-csp.mjs`, capturas (T022) | ✅ | |
| CA4 | `imagen-contenedor.test.js`, `probar-nginx.mjs` | ✅ | En producción, T097 |
| CA5 | `imagen-contenedor.test.js`, `trivy fs`, `trivy image` | ✅ | `trivy image` 0 altas/críticas |
| CA6 | `imagen-contenedor.test.js` | ✅ | |
| CA7 (abuso) | `probar-nginx.mjs` (6 intentos, rechazo con motivo) | ✅ | R1 corregido |
| CA8 | T024 | ✅ | |

## Conformidad con el plan
- Cambios fuera del plan: ninguno (`probar-nginx.mjs`, T027 y T028).
- Partes del plan sin implementar: ninguna.

## Constitution Check (sobre el código)
| Principio | Resultado | Evidencia |
|---|---|---|
| P2 Tests por feature | ✅ | T027 y T028 comprobados rompiendo |
| P11 Vulnerabilidades | ✅ | `trivy image` 0 altas; SCA sin altas |
| P12 Modelo de amenazas | ✅ | Tests de TM1 y TM5 ya no dan verde en falso |
| Resto | ✅ / ➖ | Sin cambios respecto a la ronda 1 |

## Seguridad
| Herramienta | Resultado |
|---|---|
| gitleaks (diff `c067951..HEAD`) | ✅ 0 hallazgos |
| SAST | ➖ no aplica |
| SCA (`npm audit --audit-level=high`) | crít: 0 · alta: 0 |
| trivy image (imagen de `probar-nginx`) | ✅ 0 altas · 0 críticas |
| trivy fs | AVD-DS-0002 solo en `backend/Dockerfile` (desarrollo): excepción acotada en `/release` (T098) |

| Tema OWASP (Top 10:2025) | Resultado | Evidencia |
|---|---|---|
| A02 Mínimo privilegio y escritura denegada | ✅ | Control positivo + 6 intentos con motivo |
| A02/A06 Reenvío a la API sin root | ✅ | `/api/` con 64 KB → 502 sin backend; 500 si `client_temp` no se puede escribir |

## Observabilidad
- Eventos de auditoría: no aplica. Datos sensibles en logs: ninguno. `request_id`: no aplica.

## SEO
| Tema | Resultado | Evidencia |
|---|---|---|
| Estados, `noindex`, redirecciones | ✅ | `probar-nginx.mjs` (dos ejecuciones) |
- Sección "Descubribilidad" del plan aplicada: sí (no aplica, sin rutas nuevas).

## Hallazgos
| ID | Severidad | Archivo:línea | Hallazgo | Sugerencia |
|---|---|---|---|---|
| R1 | importante | `frontend/scripts/probar-nginx.mjs:11-17, 43-67, 92-94` | **Corregido** (T027): control positivo, código de `ps`, rechazo con motivo, 6 intentos, `setcap` con respuesta explícita | — |
| R2 | importante | `frontend/scripts/probar-nginx.mjs:34-38` | **Corregido** (T028): `/api/` con cuerpo de 64 KB → 502 sin backend | — |

## Preparación para release
- Rollback factible: sí (T024, solo el frontend).
- Migraciones y feature flags: no hay.
- Docs actualizadas: `architecture.md` (T090) y `deployment.md` (T091).
- Antes de liberar: acotar la fila AVD-DS-0002 de `docs/security.md` a `backend/Dockerfile` (T098); hoy aún describe el frontend.

## Tareas añadidas
- T027 ← R1 (ronda 1)
- T028 ← R2 (ronda 1)

## Aceptados sin tarea
- **R3** → roadmap: el `sed` del `Dockerfile` del frontend debe comprobar que quitó `user` y movió `pid`
- **R4** → roadmap: `libxml2` sin versión en el build; fijar `>=2.13.9-r3` o retirar la línea al subir la imagen de nginx
- **R5** → roadmap: el test de `USER` exige `nginx` y rechaza `$` y el grupo root
- **R6** → roadmap: `fileURLToPath` en `imagen-contenedor.test.js`
- **R7** → roadmap: reescribir el parser del `Dockerfile` en `imagen-contenedor.test.js` con un caso de prueba
- **R8** → roadmap: capa propia y comentario claro para `libxml2` en el `Dockerfile`
- **R9** → roadmap: partir la línea larga de `enContenedor` en `probar-nginx.mjs`
- **R10** → roadmap: regla de ruta protegida de `tasks.md` de la 025 sin T026
- **R11** → roadmap: al subir las imágenes con `/chore`, comprobar que la etiqueta corresponde al digest
- **R12** → roadmap: endurecer el servicio frontend del compose de producción (`cap_drop`, `read_only`, tmpfs) sin `no-new-privileges`
- **R13** → roadmap: quitar `BACKEND_HOST` y `BACKEND_PORT` del compose de producción
