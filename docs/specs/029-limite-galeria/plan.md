---
spec: 029-limite-galeria
status: approved   # draft | approved | blocked
constitution_version: 1.0.0
created: 2026-11-23
---

# Plan · 029 Límite de 15 imágenes en la galería

## Enfoque técnico
El límite lo aplica el servicio de imágenes del backend al dar de alta (P8, P17). Para que contar y
guardar sean atómicos (CA7), el repositorio toma un **bloqueo con nombre de MySQL**
(`GET_LOCK('dentissa_galeria_alta', 5)`) en una conexión propia. Con el bloqueo tomado cuenta las
imágenes, inserta solo si hay menos de 15 y lo suelta en un `finally`. Si el alta se rechaza por
cualquier motivo, el servicio borra la foto que multer ya escribió en disco (CA2). Editar y
eliminar no pasan por el límite (CA3, CA4). El panel cuenta las imágenes que ya recibe de
`GET /imagenes`, muestra «N de 15 imágenes» y, con 15, deja el botón «Nueva imagen» no disponible
con `aria-disabled` y el aviso informativo, según el `design.md` aprobado. El número 15 vive en una
constante en cada paquete y un test exige que las dos coincidan.

## Constitution Check
| Principio | Resultado | Justificación / ajuste | Cómo se verifica |
|---|---|---|---|
| P1 Spec antes de implementar | ✅ | Spec 029 `approved` y `design.md` `approved` | manual: `aidd.py status` antes de `/implement` |
| P2 Tests por feature | ✅ | Cada CA tiene test de Jest o Vitest (Trazabilidad) | test: suites de `backend/tests/galeria/` y `frontend/tests/galeria-limite.test.jsx` en CI |
| P3 Dependencias nuevas con ADR | ➖ | No se añade ninguna dependencia | — |
| P4 Arquitectura con ADR | ✅ | Sigue `.routes/.controller/.service/.repository`. El bloqueo con nombre es una técnica de repositorio y no contradice `architecture.md` | manual: `/review` |
| P5 Producción solo con aprobación humana | ✅ | `/release` con aprobación escrita | manual: T096 |
| P6 Rollback documentado | ✅ | Ver Rollout: sin migración, revertir el commit y reconstruir | manual: Rollout |
| P7 Migraciones compatibles | ➖ | Sin cambios de esquema: el conteo usa la tabla `imagenes` tal como está | — |
| P8 Autorización en el servidor | ✅ | `POST /imagenes` conserva `verifyToken` y `authorizeRoles("Administrador", "Asistente")`, y el límite se aplica en el servicio, no solo en el panel | test: `rutas-galeria.test.js` → sin token 401, Paciente 403, Asistente y Administrador con 15 → 409 |
| P9 Entrada validada y SQL parametrizado | ✅ | Las consultas nuevas (`GET_LOCK`, `COUNT`, `INSERT`, `RELEASE_LOCK`) llevan los valores en `?`; los campos del alta son los mismos de hoy | test: `limite-galeria-concurrencia.test.js` → valores solo en los parámetros |
| P10 Secretos fuera del repositorio | ✅ | No hay secretos nuevos | lint: gitleaks en CI |
| P11 Sin vulnerabilidades críticas o altas | ✅ | Línea base 2026-11-23: `npm audit --audit-level=high` sale con 0 en backend y frontend (backend con 20 moderadas previas) | test: npm audit y trivy en CI y en `/release` |
| P12 Modelo de amenazas en datos sensibles | ✅ | No toca datos sensibles, pero recibe archivos subidos: el modelo de amenazas va igual | manual: sección «Modelo de amenazas» revisada en `/analyze` |
| P13 Auditoría de datos sensibles | ➖ | La galería no tiene datos sensibles ni la spec añade acciones administrativas nuevas. El registro de acciones administrativas sigue en el objetivo 3 (specs 027 y 028), con la excepción vigente del usuario (2026-11-11) | — |
| P14 Correlación por petición | ✅ | El rechazo 409 pasa por los middlewares de la spec 026: lleva `X-Request-Id` y una línea «Petición atendida» | test: `rutas-galeria.test.js` → la respuesta 409 trae `X-Request-Id` |
| P15 Logs sin datos sensibles | ✅ | Sin logs nuevos. El error de `borrarArchivo` ya registra solo el `code` | test: `rutas-galeria.test.js` → los logs del 409 no contienen el título ni el nombre del archivo |
| P16 Accesibilidad WCAG 2.1 AA | ✅ | `aria-disabled` + `aria-describedby` en el botón, aviso con `role="status"` y contraste del aviso de 9,63:1 (`design.md`) | test: `galeria-limite.test.jsx` consulta el botón por rol y su descripción accesible, y calcula el contraste del aviso desde los tokens; manual: NVDA y teclado en `/admin/galeria` |
| P17 Sin lógica de negocio en las vistas | ✅ | La regla vive en `images.service`; el panel solo refleja el conteo y no impide nada que el servidor permita | test: `rutas-galeria.test.js` (CA8: se rechaza sin pasar por el panel) |
| P18 Metadatos por ruta indexable | ➖ | No cambia ninguna ruta indexable (`/galeria` igual, CA9) | — |
| P19 Noindex fuera de lo público | ➖ | `/admin/galeria` ya lleva `noindex` (spec 022) y no cambia | — |
| P20 La interfaz usa solo el sistema de diseño | ✅ | Los estilos nuevos usan `var(--primary-50)`, `var(--primary-100)` y `var(--ink-2)`. El aviso se incorpora antes a `system.md` («Cambios a incorporar») | test: `galeria-limite.test.jsx` → las reglas CSS nuevas no tienen colores literales (control positivo con un literal de ejemplo) |

## Cambios por módulo
| Módulo | Cambio | Riesgo |
|---|---|---|
| `backend/src/modules/images/images.limites.js` (nuevo) | `MAX_IMAGENES_GALERIA = 15` y el mensaje de rechazo de CA2 | bajo |
| `backend/src/modules/images/images.repository.js` | `crearImagenConLimite(datos, max, origen = pool)`: conexión propia, `GET_LOCK` con espera de 5 s, `COUNT(*)`, `INSERT` si `total < max`, y `RELEASE_LOCK` + `release()` en `finally`. Devuelve `{ creada, id }`, `{ creada: false, total }` o `{ bloqueo: false }`. `createImagen` deja de usarse en el alta | medio: un bloqueo sin soltar frenaría las altas (TM4) |
| `backend/src/modules/images/images.service.js` | `createImagen` valida como hoy y llama a `crearImagenConLimite`: 409 con el mensaje de CA2 si está llena, 503 «La galería está ocupada. Intenta de nuevo.» si no obtuvo el bloqueo. Ante cualquier error borra `data.imagen` con `borrarArchivo` y vuelve a lanzar. `updateImagen` y `deleteImagen` sin cambios | bajo |
| `docs/design/system.md`, `docs/design/system.html` | Primera tarea: «Aviso informativo del panel» y `aria-disabled` en `EncabezadoModulo`. DS10 pasa a «parcial» | bajo |
| `frontend/src/utils/limitesGaleria.js` (nuevo) | `MAX_IMAGENES_GALERIA = 15` | bajo |
| `frontend/src/components/EncabezadoModulo.jsx` | Props opcionales `detalle` (línea bajo la descripción), `botonNoDisponible` y `idDescripcionBoton`. Con `botonNoDisponible`: `aria-disabled="true"`, `aria-describedby` y el clic no llama a `onBoton`. Sin esas props, el comportamiento y el DOM de las otras 14 pantallas no cambian | medio: componente compartido (lo cubre el test de no regresión) |
| `frontend/src/styles/adminpanel.css` | `.encabezado-detalle` (mismo estilo que `.encabezado-descripcion`), `.encabezado-btn[aria-disabled="true"]` (mismos valores que el `:disabled` actual) y `.aviso-panel` solo con tokens | bajo |
| `frontend/src/pages/admin/Admingaleria.jsx` | Contador `${imagenes.length} de ${MAX} imágenes` en `detalle`, `botonNoDisponible` con 15 o más, aviso `role="status"` con `id` entre el encabezado y los filtros, y `abrirNueva` que no abre el modal con la galería llena. El error del servidor (409/503) sale en el `errorForm` de hoy | bajo |

## Contratos y datos
**`POST /api/v1/imagenes`** (Administrador, Asistente): el cuerpo y la respuesta 201 no cambian.
Respuestas nuevas:

| Caso | Código | Cuerpo |
|---|---|---|
| Galería con 15 o más | `409` | `{ "status": "fail", "message": "La galería admite como máximo 15 imágenes. Elimina una para agregar otra." }` |
| Bloqueo no obtenido en 5 s | `503` | `{ "status": "fail", "message": "La galería está ocupada. Intenta de nuevo." }` |

En los dos casos, y en los 400 de hoy, la foto recibida se borra del disco.

`PUT /imagenes/:id`, `DELETE /imagenes/:id`, `GET /imagenes` y `GET /imagenes/publicas` no
cambian. El panel cuenta con `GET /imagenes`, que ya trae todas, visibles y ocultas.

**Datos:** sin migración. El bloqueo con nombre no deja nada guardado.

**Panel `/admin/galeria`:**

| Estado | Qué se ve | Accesibilidad |
|---|---|---|
| Con sitio (N < 15) | «N de 15 imágenes» bajo la descripción; «Nueva imagen» activo | el contador es texto normal del encabezado |
| Llena (N ≥ 15) | «15 de 15 imágenes», botón atenuado y aviso «Llegaste al máximo de 15 imágenes. Elimina una para agregar otra.» | botón enfocable con `aria-disabled="true"` y `aria-describedby` → aviso; aviso con `role="status"` |
| Rechazo del servidor | mensaje del 409/503 en el error del modal | `<p role="alert">` de hoy |

## Estrategia de pruebas
- **Servicio (Jest, repositorio simulado):** `backend/tests/galeria/limite-galeria.test.js`.
  - Alta con 14: se crea.
  - Con 15: 409 con el mensaje exacto y `borrarArchivo` llamado con la ruta de la foto.
  - Sin obtener el bloqueo: 503 y archivo borrado.
  - 400 por campos faltantes: archivo borrado.
  - `updateImagen` con 15 no consulta el conteo y guarda.
  - Tras `deleteImagen`, otra alta pasa.
- **Concurrencia (Jest):** `backend/tests/galeria/limite-galeria-concurrencia.test.js`.
  - Servicio con un repositorio falso que serializa como el bloqueo: con 14, dos altas
    simultáneas → una 201 y una 409, total 15.
  - Repositorio con una conexión falsa:
    - el orden es `GET_LOCK` → `COUNT` → `INSERT` → `RELEASE_LOCK`, todo en la misma conexión;
    - con 15 no hay `INSERT`;
    - si el `INSERT` lanza, igual se ejecutan `RELEASE_LOCK` y `release()`;
    - si `GET_LOCK` devuelve 0 → `{ bloqueo: false }`, sin `COUNT`;
    - los valores van solo en los parámetros.
- **HTTP (Jest + supertest):** `backend/tests/galeria/rutas-galeria.test.js`, con el repositorio
  simulado y multer simulado como en `rutas-usuarios.test.js`.
  - Sin token → 401; Paciente → 403.
  - Asistente y Administrador con 15 → 409 y borrado del archivo (CA8).
  - La respuesta trae `X-Request-Id` y los logs no traen el título ni el nombre del archivo.
- **Panel (Vitest + Testing Library):** `frontend/tests/galeria-limite.test.jsx`, con `api`
  simulado.
  - Con 3: «3 de 15 imágenes» y el botón disponible.
  - Con 15: botón con `aria-disabled="true"`, su descripción accesible es el aviso, el clic no
    abre el diálogo y el aviso tiene `role="status"`.
  - Agregar y eliminar actualizan el contador sin recargar.
  - Un 409 al guardar muestra el mensaje en el `role="alert"` del modal.
  - Contraste `--ink-2` sobre `--primary-50` ≥ 4,5:1, leído de `global.css`.
  - Reglas CSS nuevas sin literales de color.
  - La constante del frontend coincide con la de `backend/src/modules/images/images.limites.js`.
- **No regresión:**
  - `frontend/tests/encabezado-modulo.test.jsx`: sin las props nuevas, el botón no lleva
    `aria-disabled` y el clic llama a `onBoton`.
  - `galeria-estados.test.jsx` (spec 023) sigue en verde, y la página pública no muestra «de 15» (CA9).
- **Manual:**
  - Dos altas simultáneas con `curl` contra el MySQL de Docker local, con 14 imágenes: queda en 15.
  - Capturas de `/admin/galeria` a 390 y 1440 px, con sitio y llena (K1, K2).
  - NVDA y teclado sobre el botón no disponible (K3).

## Modelo de amenazas
| ID | Amenaza (STRIDE) | Categoría OWASP | Componente | Control | Test |
|---|---|---|---|---|---|
| TM1 | Tampering: dos altas simultáneas cuentan 14 y las dos insertan (16) | A06:2025 Insecure Design | `images.repository` | `GET_LOCK` con nombre y `COUNT` + `INSERT` en la misma conexión mientras se tiene | `limite-galeria-concurrencia.test.js` (CA7) |
| TM2 | Elevation: saltarse el botón desactivado llamando a la API | A06:2025 Insecure Design | `images.service` | El límite se aplica en el servicio, el panel solo lo refleja | `rutas-galeria.test.js` (CA8) |
| TM3 | Denial of service: altas rechazadas que dejan sus fotos en disco hasta llenarlo | A06:2025 Insecure Design | `images.service` | `borrarArchivo(data.imagen)` ante cualquier error del alta | `limite-galeria.test.js` (409, 503 y 400 borran el archivo) |
| TM4 | Denial of service: un bloqueo sin soltar deja las altas colgadas | A10:2025 Mishandling of Exceptional Conditions | `images.repository` | `RELEASE_LOCK` y `release()` en `finally`; espera máxima de 5 s y 503. MySQL suelta el bloqueo si la conexión se cierra | `limite-galeria-concurrencia.test.js` (el `INSERT` que lanza igual suelta; `GET_LOCK` 0 → 503) |
| TM5 | Elevation: un Paciente o alguien sin sesión da de alta imágenes | A01:2025 Broken Access Control | `images.routes` | `verifyToken` + `authorizeRoles` de hoy, sin cambios | `rutas-galeria.test.js` (401, 403) |

## Trazabilidad
| Criterio de aceptación | Cambio(s) | Test(s) |
|---|---|---|
| CA1: con menos de 15, el alta funciona | `images.service`, `images.repository` | unit `limite-galeria.test.js` «con 14 se crea» |
| CA2: con 15, rechazo con el mensaje, sigue en 15 y la foto no queda | `images.service`, `images.repository`, `images.limites.js` | unit `limite-galeria.test.js` «con 15 → 409 y borra el archivo»; concurrencia «con 15 no hay INSERT»; Vitest `galeria-limite.test.jsx` «el 409 sale en el alert del modal» |
| CA3: editar o reemplazar con 15 se permite | `images.service` (sin cambio en `updateImagen`) | unit `limite-galeria.test.js` «update con 15 no consulta el conteo y guarda» |
| CA4: tras eliminar, se puede agregar | `images.service` | unit `limite-galeria.test.js` «tras eliminar, otra alta pasa»; Vitest «eliminar actualiza el contador y reactiva el botón» |
| CA5: «N de 15 imágenes» actualizado sin recargar | `Admingaleria.jsx`, `EncabezadoModulo.jsx`, `limitesGaleria.js` | Vitest `galeria-limite.test.jsx` «3 de 15», «agregar y eliminar actualizan» · verificación manual: capturas a 390 y 1440 px (K1) |
| CA6: con 15, acción no disponible, aviso y anuncio al lector | `Admingaleria.jsx`, `EncabezadoModulo.jsx`, `adminpanel.css` | Vitest `galeria-limite.test.jsx` «aria-disabled, descripción accesible = aviso, el clic no abre, role=status» · verificación manual: capturas (K2) y NVDA + teclado en `/admin/galeria` (K3) |
| CA7 (abuso): dos altas simultáneas con 14 → solo una | `images.repository` | concurrencia `limite-galeria-concurrencia.test.js` «una 201 y una 409», «GET_LOCK → COUNT → INSERT → RELEASE_LOCK en la misma conexión» · verificación manual: dos `curl` simultáneos contra MySQL de Docker local |
| CA8 (abuso): alta sin pasar por el panel con 15 → rechazo | `images.service` | HTTP `rutas-galeria.test.js` «Asistente y Administrador con 15 → 409» |
| CA9: la galería pública no cambia | ninguno en `Gallery.jsx` | Vitest `galeria-estados.test.jsx` (regresión) y `galeria-limite.test.jsx` «la página pública no muestra el límite» |
| TM1 | `images.repository` | `limite-galeria-concurrencia.test.js` |
| TM2 | `images.service` | `rutas-galeria.test.js` |
| TM3 | `images.service` | `limite-galeria.test.js` |
| TM4 | `images.repository` | `limite-galeria-concurrencia.test.js` |
| TM5 | `images.routes` | `rutas-galeria.test.js` |
| RNF: WCAG 2.1 AA | `adminpanel.css`, `EncabezadoModulo.jsx` | Vitest contraste desde tokens y roles · verificación manual: NVDA y teclado |
| RNF: mensajes en español y sin detalles internos | `images.limites.js`, `images.service` | `rutas-galeria.test.js` compara el cuerpo exacto del 409 y del 503 |
| RNF: el límite lo aplica el servidor | `images.service` | `rutas-galeria.test.js` (CA8) |

## Observabilidad
No aplica más allá de lo existente: la spec no toca datos sensibles, autenticación ni permisos.
- Logs nuevos: ninguno. El 409 y el 503 quedan en la línea «Petición atendida» de la spec 026,
  con su `status` y su `request_id`.
- Eventos de auditoría: ninguno (P13 ➖).
- Métricas y alertas: no hay (ver `docs/observability.md`).
- Cómo se verifica tras el deploy:
  `docker compose logs backend --since 10m | grep '"status":409'` después de la prueba manual con
  la galería llena; sin líneas `error` de `GET_LOCK`.

## Descubribilidad
No aplica: la spec no crea ni cambia rutas públicas. `/galeria` sigue igual (CA9) y `/admin/galeria`
ya es `noindex`.

## Rollout
- Feature flag: no aplica. El cambio es pequeño, no altera un flujo de pacientes y se revierte
  reconstruyendo.
- Orden de despliegue: backend y frontend en el mismo `up -d --build` (sin migración).
- Compatibilidad:
  - El frontend anterior con el backend nuevo recibe el 409 y lo muestra en el error del modal
    de hoy.
  - El frontend nuevo con el backend anterior muestra el contador, pero el servidor no limita.
    Solo ocurre durante el despliegue.
- Rollback:
  1. En el servidor, `git checkout <commit anterior> -- ../backend/src/modules/images ../frontend`.
  2. `docker compose --env-file .env.prod -f docker-compose.prod.yml build --no-cache backend frontend`.
  3. `up -d backend frontend`.
  Sin efecto en datos: no hay migración y las imágenes no se tocan.
- Métricas a vigilar tras el deploy: respuestas 5xx de `/api/v1/imagenes` (no debe haber 503 fuera
  de la prueba) y un alta normal con la galería por debajo de 15.

## Decisiones (→ ADR si son arquitectónicas)
- **Atomicidad del límite (CA7): `GET_LOCK` con nombre** en lugar de transacción con
  `SELECT … FOR UPDATE` (patrón de la spec 021).
  - Con pocas o ninguna fila, `FOR UPDATE` toma solo bloqueos de hueco, que son compatibles
    entre sí: dos altas pueden acabar en un *deadlock* y una de ellas en un 500.
  - El bloqueo con nombre serializa las altas sin depender de las filas ni del nivel de
    aislamiento.
  - La tercera opción, un `INSERT … SELECT … WHERE COUNT < 15`, tiene el mismo problema de huecos.
  - Sin ADR: no cambia la arquitectura ni añade dependencias.
- **Código 409 Conflict** para la galería llena: el pedido es válido, pero choca con el estado del
  recurso. El 400 queda para la entrada inválida, como hoy.
- **Borrar la foto ante cualquier rechazo del alta**, no solo el del límite. Es el mismo punto del
  código y evita la misma acumulación de archivos con los 400 de hoy. Amplía CA2 de forma
  compatible con la spec 014, en línea con su CA3 (no dejar en disco archivos sin imagen).
- **El 15 se duplica en backend y frontend**, como los 6 MB, con un test que exige que coincidan.
  No hay workspaces para compartir código entre paquetes, y cambiar `GET /imagenes` para enviar el
  límite rompería su contrato.
- **`aria-disabled` en vez de `disabled`:** viene de `design.md` (CA6).

## Impacto en arquitectura
- `docs/architecture.md`: nada estructural. En T090, añadir en el módulo `images` la mención del
  límite de altas y del bloqueo con nombre.
- `docs/design/system.md`: el aviso informativo del panel y `aria-disabled` en `EncabezadoModulo`
  (primera tarea). DS10 pasa a parcial.

## Riesgos y mitigaciones
- **Un bloqueo que no se suelta:** `finally` con `RELEASE_LOCK` y `release()`; si la conexión
  muere, MySQL lo suelta solo. Los tests de TM4 lo cubren.
- **Regresión en las otras 14 pantallas con `EncabezadoModulo`:** las props nuevas son opcionales,
  y un test de no regresión comprueba el comportamiento sin ellas.
- **Que el contador y el servidor no coincidan** (otra persona agregó desde otra pestaña): el
  servidor manda. El 409 se muestra en el modal y el panel vuelve a pedir la lista para corregir
  el contador (test en `galeria-limite.test.jsx`, caso del 409).
- **Riesgos documentados (RS/OB/RD/SE):** la spec no cita ninguno. DS10 (deuda del sistema de
  diseño) se atiende **parcialmente**: el botón del encabezado. La trampa de foco del modal y el
  `:disabled` de `.dt-btn` quedan en DS10.
