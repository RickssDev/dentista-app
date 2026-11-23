---
spec: 025-frontend-sin-root
verdict: changes_requested
round: 1
date: 2026-11-23
base: c067951
head: f9732c3
human_signoff: pending
---

# Review · 025 Servicio del sitio sin privilegios de administrador

## Resumen
El contenedor del frontend cumple los criterios: corre como `nginx` en el puerto 80, con solo
`cap_net_bind_service`, sin permiso para cambiar lo que sirve, con las imágenes base fijadas y sin
vulnerabilidades altas. Se piden cambios por dos importantes en `probar-nginx.mjs`. R1: las
comprobaciones dentro del contenedor dan verde si `docker exec` falla por otra razón. R2: nada
prueba el reenvío a `/api/`, que es lo que el modo sin root podría romper. Revisores
independientes: Spec y Seguridad (perfil `critical`), Constitución y calidad (`standard`). Sin
revisor de accesibilidad (no hay interfaz) ni de SEO (el HTML y las respuestas no cambian;
`probar-nginx.mjs` comprueba estados, `noindex` y redirecciones).
Conteo: bloqueante 0 · importante 2 · menor 11

## Verificación automática
| Comando | Resultado |
|---|---|
| `npm test` | ✅ backend 256 (+5 todo), frontend 224; línea base: 0 fallos |
| `npm run lint --prefix backend` / `--prefix frontend` | ✅ 4 y 7 errores previos, ninguno en archivos de la spec |
| `npm run build --prefix frontend` | ✅ |
| `node scripts/probar-nginx.mjs` (×2) | ✅ las dos pasan |
| `aidd.py validate` | ✅ 0 errores |

## Criterios de aceptación
| CA | Test | Estado | Nota |
|---|---|---|---|
| CA1 | `imagen-contenedor.test.js` (`USER`), `probar-nginx.mjs` (procesos) | ⚠ | Pasa, pero no mira el código de salida de `ps` (R1) |
| CA2 | `probar-nginx.mjs` (respuestas, cabeceras) | ⚠ | Sin comprobación del reenvío a `/api/` (R2) |
| CA3 | `probar-csp.mjs` y capturas (T022) | ✅ | Verificación manual confirmada por el usuario |
| CA4 | `imagen-contenedor.test.js` (`EXPOSE 80`), `probar-nginx.mjs` (puerto 80) | ✅ | En producción, T097 |
| CA5 | `imagen-contenedor.test.js`, `trivy fs`, `trivy image` | ✅ | `trivy image` 0 altas; AVD-DS-0002 solo en `backend/Dockerfile` (excepción acotada en `/release`) |
| CA6 | `imagen-contenedor.test.js` (`FIJADA`) | ✅ | |
| CA7 (abuso) | `probar-nginx.mjs` (escrituras) | ⚠ | Da verde si `exec` falla; no prueba `nginx.conf` ni sobrescribir lo servido (R1) |
| CA8 | T024 (registro en `.ai/inspect/025-rollback/`) | ✅ | |

## Conformidad con el plan
- Cambios fuera del plan: ninguno (3 archivos de código, todos con tarea).
- Partes del plan sin implementar: ninguna. T001, T022, T023 y T024 dejan su resultado en `.ai/inspect/`.

## Constitution Check (sobre el código)
| Principio | Resultado | Evidencia |
|---|---|---|
| P2 Tests por feature | ⚠ | Las pruebas existen y se comprobaron rompiendo; R1 y R2 son huecos de esas pruebas |
| P3 Dependencias con ADR | ✅ | `libcap-setcap` solo en el build y retirado; `libxml2` ya existía |
| P6 Rollback | ✅ | T024 |
| P10 Secretos | ✅ | gitleaks sin hallazgos |
| P11 Vulnerabilidades | ✅ | `trivy image` 0 altas/críticas; SCA sin altas |
| P12 Modelo de amenazas | ✅ | TM1–TM6 con control; tests de TM1 y TM5 afectados por R1 |
| P18, P19 | ✅ | `probar-nginx.mjs` |
| Resto | ➖ | Sin datos, endpoints, vistas ni logs |

## Seguridad
| Herramienta | Resultado |
|---|---|
| gitleaks (diff `c067951..HEAD`) | ✅ 0 hallazgos |
| SAST | ➖ no aplica |
| SCA (`npm audit --audit-level=high`) | crít: 0 · alta: 0 |
| trivy fs | 1 alta: AVD-DS-0002 en `backend/Dockerfile` (desarrollo; decisión del usuario: excepción acotada en `/release`, T098) |
| trivy image (imagen final) | ✅ 0 altas · 0 críticas (`libxml2` 2.13.9-r3) |

| Tema OWASP (Top 10:2025) | Resultado | Evidencia |
|---|---|---|
| A02 Mínimo privilegio (no root) | ✅ | `USER nginx`; uid 101; sin binarios setuid ni setgid |
| A02 Lo servido y la configuración no se pueden modificar | ✅ | Comprobado en la imagen: solo `/var/cache/nginx`, `/tmp` y los logs son escribibles; no hay `proxy_cache` |
| A02 Capacidades mínimas | ✅ | `CapEff` 0x400; sin `cap_add` ni `--privileged` |
| A02 Scripts del entrypoint sin root | ✅ | Solo informan o no actúan |
| A03 Imágenes base fijadas | ✅ | Etiqueta y digest en los dos `FROM` |
| A03 Paquetes del build sin versión | ❌ baja | `apk upgrade libxml2` sin versión (R4) |
| A03 Vulnerabilidades conocidas | ✅ | `trivy image` limpio |
| A08 Integridad del build | ✅ con matiz | R4 |
| Proceso: rutas protegidas | ✅ | Solo T020, T021 y T026 tocan `frontend/Dockerfile`; `nginx.conf` sin cambios |
| Proceso: instrucciones a agentes | ✅ | Ninguna |

## Observabilidad
- Eventos de auditoría de la spec: no aplica.
- Datos sensibles en logs del código tocado: ninguno; los logs de nginx siguen en la salida estándar.
- `request_id` en logs nuevos: no aplica.

## SEO
| Tema | Resultado | Evidencia |
|---|---|---|
| Estados, `noindex`, redirecciones | ✅ | `probar-nginx.mjs` (dos ejecuciones) |
- Sección "Descubribilidad" del plan aplicada: sí (no aplica, sin rutas nuevas).

## Hallazgos
| ID | Severidad | Archivo:línea | Hallazgo | Sugerencia |
|---|---|---|---|---|
| R1 | importante | `frontend/scripts/probar-nginx.mjs:155, 165, 183` | Las comprobaciones dentro del contenedor no distinguen "denegado" de "no se pudo ejecutar". Escrituras (CA7) y `setcap` (TM5) dan verde ante cualquier código distinto de 0: contenedor caído, `sh` ausente, ruta inexistente. Procesos (CA1) no mira el código de `ps`. Las escrituras no prueban `nginx.conf` (lo modifica el `sed`), sobrescribir `index.html` ni `/docker-entrypoint.d` | Control positivo (`id -un` = `nginx`, escribir en `/tmp` funciona); cada intento denegado debe decir "Permission denied" o "Read-only"; `ps` con código 0 y cabecera `USER`; distinguir el 1 de `command -v` de los 125/126/127 de docker o sh; más intentos de escritura |
| R2 | importante | `frontend/scripts/probar-nginx.mjs` (sin comprobación de `/api/`) | CA2 incluye el reenvío a la API y ninguna comprobación lo toca. Sin root, los temporales del proxy van a `/var/cache/nginx`; si faltara el `chown`, nada fallaría por el proxy | Una petición a `/api/` con cuerpo grande (fuerza el archivo temporal del cuerpo) debe responder 502 sin backend, no 500 ni 403 |
| R3 | menor | `frontend/Dockerfile:44` | El `sed` sobre `nginx.conf` no comprueba que surtió efecto; si `user` sobrevive, nginx solo avisa | Comprobar en el mismo `RUN` que no queda `user` y que `pid` está en `/tmp` |
| R4 | menor | `frontend/Dockerfile:40` | `apk upgrade libxml2` sin versión: cada build puede traer otra; la regla de 7 días no consta | `libxml2>=2.13.9-r3` explícito, o aceptarlo por ser una línea temporal |
| R5 | menor | `frontend/tests/imagen-contenedor.test.js:43-46` | El test de `USER` solo rechaza el literal `root`/`0`: no `USER $U`, el grupo root ni exige `nginx` como último | Exigir `nginx` o rechazar `$` y el grupo root |
| R6 | menor | `frontend/tests/imagen-contenedor.test.js:9` | `URL.pathname` deja `%20` con espacios en la ruta | `fileURLToPath`, como los scripts vecinos |
| R7 | menor | `frontend/tests/imagen-contenedor.test.js` (parser) | El `reduce` con mutación es difícil de leer; un comentario dentro de una continuación corta la instrucción | Bucle explícito y un caso de prueba del parser |
| R8 | menor | `frontend/Dockerfile:37-41` | El comentario mezcla tres motivos; `libxml2` en la misma capa que `setcap` | Capa propia para `libxml2`, citando la comprobación de `probar-nginx.mjs` |
| R9 | menor | `frontend/scripts/probar-nginx.mjs:54` | Línea de 150 caracteres en `enContenedor` | Partirla |
| R10 | menor | `docs/specs/025-frontend-sin-root/tasks.md:19` | La regla de ruta protegida no menciona T026, que también tocó el `Dockerfile` (aprobada) | Añadir T026 |
| R11 | menor | `frontend/tests/imagen-contenedor.test.js` (`FIJADA`) | No puede comprobar que la etiqueta corresponda al digest | En el `/chore` de subida, comprobarlo con `docker buildx imagetools inspect` |
| R12 | menor | `backend/docker-compose.prod.yml` (servicio frontend) | Sin `cap_drop`, `read_only` ni tmpfs (fuera de alcance: CA4 deja el compose fijo). Ojo: `no-new-privileges` anularía la capacidad del binario | Spec o `/chore` aparte, sin `no-new-privileges` mientras el puerto siga en 80 |
| R13 | menor | `backend/docker-compose.prod.yml` (`BACKEND_HOST`, `BACKEND_PORT`) | Variables sin efecto (no hay templates); si se añadieran, `20-envsubst` no podría escribir en `conf.d` sin root | Quitarlas con un `/chore` del compose |

## Preparación para release
- Rollback factible: sí; T024 lo comprobó (solo el frontend, unos 5 minutos).
- Migraciones y feature flags: no hay.
- Docs actualizadas: `architecture.md` (T090) y `deployment.md` (T091).
- SCA: sin altas. Contenedores: `trivy image` limpio; AVD-DS-0002 de `backend/Dockerfile` pasa a la excepción acotada en `/release` (T098). Hasta entonces la fila de `security.md` aún describe el frontend: no liberar sin actualizarla.

## Tareas añadidas
- T027 ← R1
- T028 ← R2

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
