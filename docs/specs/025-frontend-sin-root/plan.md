---
spec: 025-frontend-sin-root
status: approved
constitution_version: 1.0.0
created: 2026-11-22
---

# Plan · 025 Servicio del sitio sin privilegios de administrador

## Enfoque técnico
El contenedor del frontend sigue usando `nginx` sobre Alpine, pero su última etapa termina con
`USER nginx` (uid 101). Para seguir escuchando en el puerto 80 sin root, el binario de nginx recibe
solo la capacidad `cap_net_bind_service` con `setcap`. La herramienta se instala y se retira en la
misma capa del build, así que no queda en la imagen. El proceso deja de necesitar escritura en
rutas de root: el pid pasa a `/tmp` y `/var/cache/nginx` pasa a ser de `nginx`. Las páginas y la
configuración siguen siendo de root y solo legibles para el servicio. Con esto no cambian el
puerto, `nginx.conf`, el compose de producción ni el túnel. Las dos imágenes base se fijan con
etiqueta exacta y digest. La opción se comprobó con una prueba de concepto el 2026-11-22: procesos
como `nginx`, respuesta en el 80, escrituras denegadas y trivy sin AVD-DS-0002.

## Constitution Check
Constitución 1.0.0, todavía en `draft`: el check se hace contra una constitución sin aprobar.

| Principio | Resultado | Justificación / ajuste | Cómo se verifica |
|---|---|---|---|
| P1 Spec antes de implementar | ✅ | Spec 025 aprobada el 2026-11-22 | manual: `aidd.py status` |
| P2 Tests por feature | ✅ | Prueba estática del `Dockerfile` (usuario, versiones) y comprobaciones en el contenedor dentro de `probar-nginx.mjs` (CI), escritas antes de cambiar el `Dockerfile` | test: `imagen-contenedor.test.js`, `probar-nginx.mjs` |
| P3 Dependencias con ADR | ✅ | Sin dependencias de producción nuevas. `libcap-setcap` (build) y las imágenes base, verificadas en "Contratos y datos" (origen, versión y antigüedad); el paquete se retira en la misma capa | test: `probar-nginx.mjs` (no hay `setcap` en la imagen) |
| P4 Arquitectura con ADR | ✅ | No contradice `architecture.md`; T090 documenta que el contenedor corre como `nginx` y que las versiones van fijas | manual: T090 |
| P5 Producción con aprobación humana | ✅ | `/release` | manual: T096 |
| P6 Rollback documentado | ✅ | Rollout: volver al `Dockerfile` anterior y reconstruir el frontend; sin estado | manual: verificación de rollback en la tarea final (CA8) |
| P7 Migraciones compatibles | ➖ | Sin esquema | — |
| P8 Autorización en el servidor | ➖ | Sin endpoints | — |
| P9 Entrada validada | ➖ | Sin entradas nuevas | — |
| P10 Secretos fuera del repo | ✅ | Sin secretos; el client ID de Google sigue llegando como argumento de build | test: gitleaks en CI |
| P11 Sin vulnerabilidades altas | ✅ | Cierra AVD-DS-0002; trivy sin altas ni críticas nuevas; `npm audit` sin altas (2026-11-22) | test: `imagen-contenedor.test.js` (usuario no root); trivy en `/review` y `/release` (decisión del usuario, 2026-11-22) |
| P12 Modelo de amenazas | ✅ | TM1–TM5 con control y test | test: los de Trazabilidad |
| P13 Auditoría de datos sensibles | ➖ | Sin accesos a datos | — |
| P14 Correlación por petición | ➖ | Sin logs nuevos; el reenvío a la API no cambia | — |
| P15 Logs sin datos sensibles | ➖ | Los logs de nginx siguen igual (salida estándar) | — |
| P16 Accesibilidad | ✅ | Sin cambios de interfaz: el contenido servido es el mismo (CA2, CA3) | manual: capturas antes y después (T001, T022) |
| P17 Sin lógica en las vistas | ➖ | Sin vistas | — |
| P18 Metadatos por ruta indexable | ✅ | El HTML servido no cambia | test: suite de la 022 y `probar-nginx.mjs` |
| P19 Noindex fuera de lo público | ✅ | `X-Robots-Tag` y `meta noindex` conservados | test: `probar-nginx.mjs` |
| P20 Sistema de diseño | ➖ | Sin estilos | — |

## Cambios por módulo
| Módulo / archivo | Cambio | Riesgo |
|---|---|---|
| `frontend/Dockerfile` (ruta protegida) | Las dos etapas con `imagen:X.Y.Z-alpineA.B@sha256:<digest>`. En la última: `setcap cap_net_bind_service=+ep /usr/sbin/nginx` con `libcap-setcap` instalado y retirado en la misma capa; en `/etc/nginx/nginx.conf`, quitar `user` y llevar `pid` a `/tmp/nginx.pid`; `chown -R nginx:nginx /var/cache/nginx`; `USER nginx` al final | Medio: si nginx no arranca, el sitio cae. Lo cubre `probar-nginx.mjs` en CI |
| `frontend/tests/imagen-contenedor.test.js` (nuevo) | Prueba estática: cada `FROM` con versión exacta y digest (nombra el que falla), la última etapa termina con un `USER` que no es root, `EXPOSE 80` | Bajo |
| `frontend/scripts/probar-nginx.mjs` | Comprobaciones dentro del contenedor: ningún proceso como root; el usuario del servicio no puede escribir en las páginas, en `conf.d` ni en el archivo de cabeceras; capacidades efectivas solo `cap_net_bind_service`; sin `setcap` en la imagen | Bajo; si `docker exec` no está disponible, la comprobación falla con su nombre |
| `docs/architecture.md` | T090: el contenedor del frontend corre como `nginx` y las imágenes base van fijas | — |
| `docs/deployment.md` | T091: "Rollback" con el procedimiento de este plan (solo el frontend) y "Verificación post-deploy" con `ps` sin root | — |
| `docs/security.md` | `/release`: retirar AVD-DS-0002 de "Excepciones aceptadas" | — |

No cambian `frontend/nginx.conf`, `frontend/nginx-seguridad.conf`, `backend/docker-compose*.yml` ni
el túnel.

## Contratos y datos
- Sin cambios de API, datos ni rutas. El contrato operativo que se conserva: el contenedor escucha
  en el **puerto 80** (lo usan el túnel, `http://frontend:80`, y el compose de producción,
  `127.0.0.1:${PUBLIC_PORT}:80`).
- Versiones fijadas (vigentes el 2026-11-22), verificadas según `shared/agent-security.md` §2:
  - `node:22.23.4-alpine3.24@sha256:0e1754758c2df4cfa3e68d59e2e1b7374bb7fd9ea6328eaaacf15cc934af8202`:
    Docker Official Images (`docker.io/library/node`), publicada el 2026-11-05.
  - `nginx:1.31.9-alpine3.24@sha256:fb4658584bd9a916ffb6f6e365f97c25cfdb2923801f551ea08356e695f14ff7`:
    Docker Official Images (`docker.io/library/nginx`), publicada el 2026-11-18; es la que se probó
    en la prueba de concepto. Cumple los 7 días de `security.agent.min_package_age_days` el
    2026-11-25: T020 no la fija antes (decisión del usuario, 2026-11-22, `/analyze` A5).
  - `libcap-setcap` 2.78-r0 (solo en el build): repositorio `main` de Alpine 3.24 (paquetes
    firmados que `apk` verifica), compilado el 2026-04-09. No se fija la versión: el repositorio
    retira las antiguas y rompería el build. No llega a la imagen final y T021 anota la versión
    instalada (`/analyze` A2).

## Estrategia de pruebas
- **Estática (Vitest, cada PR):** `frontend/tests/imagen-contenedor.test.js` lee el `Dockerfile` y
  comprueba, con mensajes que nombran la línea: cada `FROM` con `nombre:X.Y.Z-…@sha256:<64 hex>`;
  el último `USER` de la etapa final no es `root` ni `0`; ningún `USER root` después; `EXPOSE 80`.
  Se escribe antes del cambio y falla hoy por la razón esperada.
- **Contenedor (`probar-nginx.mjs`, CI):** además de lo que ya comprueba (códigos, cabeceras,
  `noindex`, gzip), añade comprobaciones con `docker exec`:
  - `ps` sin procesos de root (CA1);
  - `touch` o escritura en `/usr/share/nginx/html`, `/etc/nginx/conf.d` y
    `/etc/nginx/snippets/seguridad.conf`, denegadas (CA7);
  - `CapEff` del proceso 1 igual a `0x400` (solo `cap_net_bind_service`) (TM3);
  - `setcap` no está en la imagen (TM5).
  Hoy fallan las de CA1 y TM3, por la razón esperada.
- **Navegador (`probar-csp.mjs`, manual):** dos ejecuciones contra la imagen nueva (CA3).
- **Medición (`medir-rendimiento.mjs`, manual):** mediana de 5 antes (imagen de v1.5.0) y después
  (RNF); tiempo de `docker build --no-cache` antes y después (RNF ≤ 20 %).
- **trivy:** `trivy fs --scanners vuln,misconfig` (repositorio) y `trivy image --severity HIGH,CRITICAL`
  sobre la imagen construida del frontend (piezas base), en T023, en `/review` y en `/release`.
  Una alta o crítica en la imagen detiene el release hasta subir la versión con `/chore` o
  registrar una excepción (CA5, TM6; `/analyze` A1). Sin cambios en el CI (decisión del
  usuario, 2026-11-22).

## Modelo de amenazas
La spec no toca datos ni permisos de la aplicación, pero endurece el servicio que entrega las
páginas y reenvía las peticiones con datos de salud.

| ID | Amenaza (STRIDE) | Categoría OWASP | Componente | Control | Test |
|---|---|---|---|---|---|
| TM1 | Elevación de privilegios / manipulación: una falla de nginx da control de root en el contenedor para cambiar páginas, cabeceras o instalar herramientas | A02:2025 Configuración incorrecta | contenedor del frontend | `USER nginx`; páginas y configuración de root sin escritura para `nginx` | `probar-nginx.mjs` (sin procesos de root; escrituras denegadas); `imagen-contenedor.test.js` (`USER` no root) |
| TM2 | Manipulación de la cadena de suministro: la imagen base cambia bajo la misma etiqueta o una versión nueva entra sin revisión | A03:2025 Cadena de suministro | `Dockerfile` | Etiqueta exacta + digest en cada `FROM`; cambios solo con `/chore` revisado | `imagen-contenedor.test.js` |
| TM3 | Elevación: la capacidad concedida a nginx es mayor de lo necesario | A02:2025 | binario de nginx | Solo `cap_net_bind_service` por `setcap`; sin `--privileged` ni `cap_add` en el compose | `probar-nginx.mjs` (`CapEff` = `0x400`) |
| TM4 | Denegación de servicio: nginx no arranca sin root (pid, caché, scripts de arranque) y el sitio cae al desplegar | A02:2025 | arranque del contenedor | pid en `/tmp`, caché de `nginx`; el script de IPv6 solo informa (comprobado en la prueba de concepto) | `probar-nginx.mjs` completo (el contenedor responde); verificación en producción (T097) |
| TM5 | Elevación: queda en la imagen una herramienta para conceder capacidades | A02:2025 | imagen final | `apk add --virtual` y `apk del` en la misma capa | `probar-nginx.mjs` (`setcap` ausente) |
| TM6 | Elevación / divulgación: una vulnerabilidad conocida en los paquetes de las piezas base fijadas se queda en producción porque nada la detecta | A03:2025 Cadena de suministro | imagen construida | `trivy image` sobre la imagen en T023 y en cada `/release`; una alta o crítica detiene el release y se sube con `/chore` | `trivy image --severity HIGH,CRITICAL --exit-code 1` en T023 (verificación manual por versión) |

Casos de abuso de la spec: "cambiar páginas o cabeceras" → TM1 (CA7); "versión base vulnerable sin
revisión" → TM2 (CA6) y TM6 (CA5).

## Trazabilidad
| Criterio de aceptación | Cambio(s) | Test(s) |
|---|---|---|
| CA1: ningún proceso como administrador | `Dockerfile` (`USER nginx`, pid, caché, `setcap`) | `probar-nginx.mjs` (procesos); `imagen-contenedor.test.js` (`USER`) |
| CA2: mismas respuestas y cabeceras que v1.5.0 | `Dockerfile` | `probar-nginx.mjs` (comprobaciones existentes, en CI) |
| CA3: navegador igual y sin bloqueos | `Dockerfile` | `probar-csp.mjs` (dos ejecuciones) · verificación manual: capturas de portada, contacto con el mapa y login a 390 y 1440 px iguales a las de v1.5.0 |
| CA4: mismo punto de entrada; túnel y compose sin cambios | `Dockerfile` (puerto 80) | `imagen-contenedor.test.js` (`EXPOSE 80`); `probar-nginx.mjs` (responde en el 80 del contenedor) · verificación manual: en producción, despliegue con el procedimiento actual y sitio accesible por el túnel (T097) |
| CA5: trivy sin AVD-DS-0002, sin altas nuevas y sin vulnerabilidades altas en la imagen | `Dockerfile` | `imagen-contenedor.test.js` (`USER` no root) · verificación manual: `trivy fs --scanners vuln,misconfig` y `trivy image --severity HIGH,CRITICAL` sobre la imagen construida, en T023, `/review` y `/release` |
| CA6: versiones exactas; la comprobación falla y dice cuál | `Dockerfile` (`FROM` con digest) | `imagen-contenedor.test.js` |
| CA7 (abuso): sin permisos para modificar páginas o cabeceras | `Dockerfile` (`USER nginx`; archivos de root) | `probar-nginx.mjs` (escrituras denegadas) |
| CA8: rollback actual sin pasos nuevos | — (sin estado) | verificación manual: con el `Dockerfile` de v1.5.0, `probar-nginx.mjs` pasa (el rollback es reconstruir esa imagen) |
| TM1 | `Dockerfile` | `probar-nginx.mjs`; `imagen-contenedor.test.js` |
| TM2 | `Dockerfile` | `imagen-contenedor.test.js` |
| TM3 | `Dockerfile` | `probar-nginx.mjs` (`CapEff`) |
| TM4 | `Dockerfile` | `probar-nginx.mjs` |
| TM5 | `Dockerfile` | `probar-nginx.mjs` |
| TM6 | — (proceso: escaneo de la imagen) | verificación manual: `trivy image` en T023 y en `/release` |
| RNF: rendimiento, prácticas y SEO como v1.5.0 | — | `medir-rendimiento.mjs` antes y después (mediana de 5, `benchmarkIndex` ≥ 2000) |
| RNF: descubribilidad sin cambios | — | `probar-nginx.mjs` (`noindex`, 404, redirecciones); suite de la 022 |
| RNF: build ≤ 20 % más lento | `Dockerfile` | verificación manual: tiempo de `docker build --no-cache` antes y después |

## Observabilidad
No aplica: la spec no añade logs, eventos de auditoría ni métricas. nginx sigue escribiendo a la
salida estándar del contenedor (`docker compose logs`). Verificación post-deploy: la de
`docs/deployment.md` (cabeceras con `curl -sI`) más
`docker compose ... exec frontend ps -o user,args` sin procesos de root.

## Descubribilidad
No aplica: no crea ni cambia rutas públicas. El HTML y las cabeceras servidas son los mismos; los
cuida `probar-nginx.mjs`.

## Rollout
- Feature flag: no aplica. Es la imagen del contenedor; el interruptor es la imagen desplegada.
- Orden de despliegue: solo el frontend (`build --no-cache frontend` y `up -d frontend`). El
  backend, el compose y el túnel no cambian.
- Compatibilidad: sin estado compartido; el puerto sigue siendo el 80.
- Rollback (es el que T091 deja en `docs/deployment.md` → "Rollback", `/analyze` A4): en el
  servidor, desde `backend/`, `git checkout <commit desplegado antes> -- ../frontend`,
  `docker compose --env-file .env.prod -f docker-compose.prod.yml build --no-cache frontend` y
  `... up -d frontend` (unos 5 minutos). Solo el frontend; el compose local y el resto del repo no
  cambian. T024 lo prueba en local.
- Métricas a vigilar: que el contenedor arranque (`docker compose ps`, logs sin errores de
  permisos), el sitio por el túnel, las cabeceras y `ps` sin root.

## Decisiones (→ ADR si son arquitectónicas)
| Decisión | Opciones | Elegida y motivo |
|---|---|---|
| Cómo correr nginx sin root manteniendo el puerto 80 | (A) `USER nginx` + `setcap cap_net_bind_service` en `nginx:alpine`; (B) `nginx-unprivileged` en el 8080; (C) `nginx:alpine` escuchando en el 8080 | **A**: no cambia el puerto ni el compose de producción (con cambios locales en el servidor) ni el túnel. B y C obligan a tocar los tres. Comprobado con una prueba de concepto el 2026-11-22 (decisión del usuario en `/chore`, 2026-11-22) |
| Forma de fijar las versiones | etiqueta exacta; etiqueta exacta + digest | **Etiqueta + digest**: exacta al byte y legible (decisión del usuario, 2026-11-22) |
| Cambios al `nginx.conf` principal de la imagen | archivo `nginx.conf` principal propio en el repo; `sed` en el build | **`sed`** de dos líneas (`user`, `pid`): con el digest fijo, el archivo base no cambia sin revisión, y `probar-nginx.mjs` falla si nginx no arranca |
| trivy como check obligatorio del PR | sí, en el workflow; no, en `/review` y `/release` | **No**: sin tocar `.github/workflows` (ruta protegida); CI cubre el usuario y las versiones con la prueba estática (decisión del usuario, 2026-11-22) |
| Escaneo de CVEs de las piezas base | ninguno; `trivy image` en T023 y `/release`; además en el CI semanal | **`trivy image` en T023 y en cada `/release`**, sin tocar el CI (decisión del usuario, 2026-11-22, `/analyze` A1) |
| `HEALTHCHECK` en la imagen (trivy AVD-DS-0026, LOW) | añadirlo; dejarlo | **Dejarlo fuera**: no es de la spec; la comprobación de salud del sistema se trata aparte en el roadmap |
| Antigüedad de la imagen de nginx | fijar el digest más nuevo ya; esperar a que cumpla 7 días | **Esperar**: T020 queda bloqueada hasta el 2026-11-25 y fija el digest del 2026-11-18 (decisión del usuario, 2026-11-22, `/analyze` A5) |

## Riesgos y mitigaciones
| Riesgo | Mitigación |
|---|---|
| nginx no arranca en producción (permisos, pid) y el sitio cae | `probar-nginx.mjs` en CI levanta la imagen real; despliegue solo del frontend con rollback de unos 5 minutos |
| El kernel o el runtime del servidor no respetan las capacidades de archivo (`setcap`) | El conjunto de límites por defecto de Docker incluye `NET_BIND_SERVICE`; se comprueba al desplegar (`docker compose ps`, logs). Si falla, rollback y replantear con la opción B |
| Una versión base fijada acumula CVEs con el tiempo | `trivy image` en cada `/release` (TM6); se sube con `/chore` (decisión del usuario en la spec) |
| Los scripts de `/docker-entrypoint.d/` cambian de comportamiento sin root | Con el digest fijo no cambian sin revisión; hoy el de IPv6 solo informa (nuestro `default.conf` es propio) |
| El servidor de producción construye con una caché vieja de `nginx:alpine` | El digest obliga a usar esa imagen exacta; `build --no-cache frontend` como en v1.4.0 |

## Impacto en arquitectura
- `docs/architecture.md`, sección del frontend (T090): el contenedor corre como `nginx` con solo
  `cap_net_bind_service`, y las imágenes base van con etiqueta y digest (se suben con `/chore`).
- Sin ADR: no hay dependencias de producción nuevas ni decisiones que contradigan
  `architecture.md`.
