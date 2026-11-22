---
spec: 025-frontend-sin-root
plan: plan.md
impl_base: c067951
status: approved
---

# Tareas · 025 Servicio del sitio sin privilegios de administrador

Formato:
`- [ ] T### [P] <verbo + qué> — <archivos> — hecho cuando: <criterio> — cubre: CA# — depende: T###`
- T001–T089: trabajo. T090–T099: reservadas.
- `[P]` = paralelizable con las demás `[P]` de su grupo una vez cumplidas sus dependencias (no
  comparte archivos con otra tarea abierta).
- Lo generado por un comando cuenta como un archivo: `.ai/inspect/025-antes/ (generado por <comando>)`.
- `[-]` = obsoleta (`— obsoleta: <motivo> (AAAA-MM-DD)`): no cuenta como abierta ni como hecha.
- Bajo una tarea: `  - nota: …`, `  - bloqueo: AAAA-MM-DD — <qué falta> — <skill a ejecutar>`.
- La comprobación a mano va en la tarea que construye la pieza.
- `frontend/Dockerfile` es ruta protegida: solo lo tocan T020 y T021.
- `probar-nginx.mjs` (CI) queda en rojo desde T011 hasta T021: el PR se abre al final.
- Los scripts de medición y capturas se ejecutan desde PowerShell (Git Bash convierte `/ruta` en una ruta de Windows).

## Constitution Check
Revisión del desglose contra `plan.md` (constitución 1.0.0, en `draft`).

| Principio | Resultado | Justificación / ajuste | Cómo se verifica |
|---|---|---|---|
| P1 Spec antes de implementar | ✅ | Spec y plan aprobados antes de T001 | manual: `aidd.py validate` |
| P2 Tests por feature | ✅ | T020 y T021 dependen de T010 y T011, escritas antes y fallando por la razón esperada | test: T010, T011 |
| P3 Dependencias con ADR | ✅ | Ninguna tarea añade dependencias de producción; `libcap-setcap` y las imágenes base, verificadas en el plan; el paquete solo vive en el build (T021) y T011 comprueba que no queda | test: T011 |
| P4 Arquitectura con ADR | ✅ | Sin cambio de arquitectura; T090 lo documenta | manual: T090 |
| P5 Producción con aprobación humana | ✅ | T096 | manual: T096 |
| P6 Rollback documentado | ✅ | T024 comprueba el rollback; Rollout del plan | manual: T024 |
| P7–P9 | ➖ | Sin esquema, endpoints ni entradas | — |
| P10 Secretos | ✅ | Ninguna tarea toca secretos; el client ID sigue como argumento de build | test: gitleaks en CI |
| P11 Vulnerabilidades | ✅ | T023 corre `trivy fs`, `trivy image` sobre la imagen construida y `npm audit`; la excepción AVD-DS-0002 se retira en `/release` (T098) | manual: trivy en T023 |
| P12 Modelo de amenazas | ✅ | Cada `TM#` con tarea de control y de test (Cobertura) | test: T010, T011 |
| P13–P15 | ➖ | Sin datos ni logs nuevos | — |
| P16 Accesibilidad | ✅ | Sin cambios visibles: capturas antes y después | manual: T001, T022 |
| P17 | ➖ | Sin vistas | — |
| P18 Metadatos | ✅ | Suite de la 022 en verde | test: suite en T023 |
| P19 Noindex | ✅ | `X-Robots-Tag` conservado | test: `probar-nginx.mjs` en T021 |
| P20 | ➖ | Sin estilos | — |

## Preparación
- [x] T001 Medir la línea base sobre v1.5.0 — `.ai/inspect/025-antes/ (generado por scripts/medir-rendimiento.mjs y scripts/capturas.mjs)` — hecho cuando: con la imagen construida desde `main` (v1.5.0): mediana de 5 de Rendimiento, Prácticas recomendadas y SEO en las siete rutas con `benchmarkIndex` ≥ 2000 en cada corrida; capturas de portada, contacto con el mapa y login a 390 y 1440 px; tiempo de `docker build --no-cache` del frontend; todo anotado como nota de esta tarea
  - nota: imagen construida desde `frontend/` de esta rama, idéntico al de v1.5.0 (`main` 616c507). Mediana de 5, Lighthouse 13.6.0 móvil, `benchmarkIndex` ≥ 2000 en todas las corridas contadas. Rendimiento / Prácticas / SEO / Accesibilidad: `/` 97/96/100/96 · `/nosotros` 98/100/100/96 · `/galeria` 100/96/100/98 · `/contacto` 100/100/100/94 · `/aviso-de-privacidad` 100/100/100/100 · `/terminos-de-servicio` 100/100/100/100 · `/login` 98/96/66/93. `/` y `/nosotros` se repitieron (`025-antes-repeticion`) porque la primera pasada tuvo corridas de 59 y 37 con el equipo ocupado; cuentan las de la repetición
  - nota: A10 — tiempo de `docker build --no-cache` del frontend, mediana de 3: 67,6 s (99,4 / 67,6 / 45,5 s; varía con la red de `npm ci`). Capturas de portada, contacto con el mapa y login a 390 y 1440 px en `.ai/inspect/025-antes/`

## Tests (antes de implementar)
- [x] T010 [P] Escribir la prueba estática de la imagen — `frontend/tests/imagen-contenedor.test.js` — hecho cuando: falla por la razón esperada (los dos `FROM` sin versión exacta ni digest; la etapa final sin `USER`) y comprueba: cada `FROM` con `nombre:X.Y.Z-…@sha256:<64 hex>`, nombrando el que falla; el último `USER` de la etapa final no es `root` ni `0` y no hay `USER root` después; `EXPOSE 80` — cubre: CA1, CA4, CA5, CA6
  - nota: falla por la razón esperada en dos ejecuciones: "línea 2: FROM node:22-alpine AS build" y "línea 26: FROM nginx:alpine" sin versión exacta ni digest, y "la etapa final no declara USER". Los mensajes llevan el número real de línea (se unen continuaciones y se ignoran comentarios sin perder la numeración). Patrón de `FROM` comprobado con 2 formas válidas y 5 inválidas (`alpine`, sin digest, `latest`, versión de dos números, digest corto). Los casos que ya pasan (dos etapas, `EXPOSE 80`) se comprueban rompiendo en T021, la tarea que puede tocar el `Dockerfile`
- [ ] T011 [P] Comprobar dentro del contenedor la identidad y los permisos — `frontend/scripts/probar-nginx.mjs` — hecho cuando: con la imagen actual falla por la razón esperada (procesos de root y capacidades completas) y añade, con `docker exec` y mensajes que nombran lo que falla: ningún proceso de `ps` como root; `touch` en `/usr/share/nginx/html` y `/etc/nginx/conf.d` y escritura en `/etc/nginx/snippets/seguridad.conf` denegadas; `CapEff` del proceso 1 igual a `0x400`; `setcap` ausente en la imagen. Las comprobaciones anteriores siguen pasando — cubre: CA1, CA7

## Implementación
- [ ] T020 Fijar las imágenes base con etiqueta exacta y digest — `frontend/Dockerfile` — hecho cuando: los casos de T010 sobre los `FROM` pasan (dos ejecuciones) con `node:22.23.4-alpine3.24@sha256:0e1754758c2df4cfa3e68d59e2e1b7374bb7fd9ea6328eaaacf15cc934af8202` y `nginx:1.31.9-alpine3.24@sha256:fb4658584bd9a916ffb6f6e365f97c25cfdb2923801f551ea08356e695f14ff7`; `probar-nginx.mjs` sigue pasando sus comprobaciones anteriores; comprobado rompiendo (quitar el digest de un `FROM` → T010 nombra esa línea) — cubre: CA6 — depende: T010
  - bloqueo: 2026-11-22 — el digest de nginx cumple los 7 días de antigüedad el 2026-11-25 (decisión del usuario, `/analyze` A5) — /implement a partir del 2026-11-25
- [ ] T021 Correr nginx sin root manteniendo el puerto 80 — `frontend/Dockerfile` — hecho cuando: T010 completo y T011 pasan (dos ejecuciones) y las demás comprobaciones de `probar-nginx.mjs` siguen en verde; en la etapa final, `setcap cap_net_bind_service=+ep /usr/sbin/nginx` con `libcap-setcap` instalado y retirado en la misma capa, sin `user` y con `pid /tmp/nginx.pid` en `/etc/nginx/nginx.conf`, `/var/cache/nginx` de `nginx` y `USER nginx` al final; comprobado rompiendo (sin `USER nginx` → T010 y T011 fallan; sin `apk del` → T011 nombra `setcap`) — cubre: CA1, CA2, CA4, CA5, CA7 — depende: T011, T020
- [ ] T022 Verificar en el navegador con la imagen nueva — `frontend/scripts/probar-csp.mjs` (solo ejecución), `.ai/inspect/025-despues/ (generado por scripts/capturas.mjs)` — hecho cuando: `probar-csp.mjs` pasa contra la imagen de T021 en dos ejecuciones (cero bloqueos, abusos bloqueados, mapa y botones de Google) · verificación manual: capturas de portada, contacto con el mapa y login a 390 y 1440 px iguales a las de T001 — cubre: CA3 — depende: T021
- [ ] T023 Medir el resultado, correr la suite y los escáneres — `.ai/inspect/025-despues/ (generado por scripts/medir-rendimiento.mjs)` — hecho cuando: mediana de 5 con `benchmarkIndex` ≥ 2000: Rendimiento ≥ T001 − 2 en cada ruta, Prácticas recomendadas ≥ T001 y SEO igual a T001; tiempo de `docker build --no-cache` ≤ 1,2 × T001; `npm test`, lint de los archivos tocados y `npm audit --omit=dev` sin altas; `trivy fs --scanners vuln,misconfig` sin AVD-DS-0002 ni hallazgos altos o críticos nuevos; `trivy image --severity HIGH,CRITICAL --exit-code 1` sobre la imagen de T021 termina en 0 (si no, la tarea se detiene: subir la versión o excepción, decisión del usuario) — cubre: CA2, CA5 — depende: T022
- [ ] T024 Comprobar el rollback — `.ai/inspect/025-rollback/ (generado por docker build y curl)` — hecho cuando: en una copia temporal del repo con la rama de esta spec, el procedimiento de "Rollback" del plan (el mismo que T091 deja en `docs/deployment.md`: `git checkout <commit de v1.5.0> -- frontend` y reconstruir solo el frontend) da una imagen que arranca en el puerto 80 y responde `/` 200 con las seis cabeceras · verificación manual: registro de los comandos y las respuestas en `.ai/inspect/025-rollback/` — cubre: CA8 — depende: T021, T091

## Integración y documentación
- [ ] T090 Actualizar `docs/architecture.md` si cambió la estructura — `docs/architecture.md` — hecho cuando: la sección del frontend dice que el contenedor corre como `nginx` con solo `cap_net_bind_service` y que las imágenes base van con etiqueta y digest, y se suben con `/chore`
- [ ] T091 Actualizar `docs/deployment.md` y `docs/observability.md` si cambiaron variables, entornos, pasos de deploy, logs, eventos de auditoría o métricas — `docs/deployment.md` — hecho cuando: "Rollback" describe el procedimiento del plan (solo el frontend: `git checkout <commit> -- ../frontend`, `build --no-cache frontend`, `up -d frontend`); "Verificación post-deploy" incluye `docker compose ... exec frontend ps -o user,args` sin procesos de root; `observability.md` sin cambios (no hay logs ni métricas nuevos)
- [ ] T092 Marcar spec como `implemented`

## Despliegue (lo ejecuta `/release`)
- [ ] T095 Desplegar a staging y verificar criterios de aceptación
  - nota: no hay staging (`docs/deployment.md`); las verificaciones se hacen con el contenedor local (T021–T024)
- [ ] T096 Aprobación humana para producción
- [ ] T097 Desplegar a producción y vigilar métricas del plan (Rollout)
  - el contenedor arranca (`docker compose ps`, logs sin errores de permisos) y `exec frontend ps -o user,args` no muestra root (usuario, CA1)
  - el sitio responde por el túnel sin cambiar su configuración ni el compose (usuario y `curl -sI`, CA4)
- [ ] T098 Marcar spec como `released`
  - la fila AVD-DS-0002 ya no está en "Excepciones aceptadas" de `docs/security.md`, y `trivy fs` (T023, `/release`) no la reporta (`/analyze` A7)
  - `trivy image --severity HIGH,CRITICAL` sobre la imagen de producción en `/release`, sin altas ni críticas (CA5, TM6)

## Cobertura
| Criterio | Tarea(s) de test | Tarea(s) de implementación |
|---|---|---|
| CA1 | T010, T011 | T021 |
| CA2 | T011 (suite de `probar-nginx.mjs`), T023 | T021 |
| CA3 | T022 | T021, T022 |
| CA4 | T010, T097 | T021 |
| CA5 | T010, T023 | T021, T098 |
| CA6 | T010 | T020 |
| CA7 | T011 | T021 |
| CA8 | T024 | T024 |

| Amenaza (TM#) | Tarea(s) de control | Tarea(s) de test |
|---|---|---|
| TM1 | T021 | T010, T011 |
| TM2 | T020 | T010 |
| TM3 | T021 | T011 |
| TM4 | T021 | T011 |
| TM5 | T021 | T011 |
| TM6 | T023, T098 | T023 |

| Cambio del plan (módulo) | Tarea(s) |
|---|---|
| `frontend/Dockerfile` | T020, T021 |
| `frontend/tests/imagen-contenedor.test.js` | T010 |
| `frontend/scripts/probar-nginx.mjs` | T011 |
| `docs/architecture.md` | T090 |
| `docs/deployment.md` | T091 |
| `docs/security.md` | T098 (retirar AVD-DS-0002 en `/release`) |

| Requisito no funcional | Tarea(s) de test o verificación manual (T095) |
|---|---|
| Rendimiento −2 como máximo, Prácticas y SEO iguales | T001, T023 |
| Descubribilidad sin cambios | T011, T023 |
| Build ≤ 20 % más lento | T001, T023 |
| Sin cambios visibles (P16) | T001, T022 |
