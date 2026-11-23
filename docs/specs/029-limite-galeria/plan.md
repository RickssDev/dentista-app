---
spec: 029-limite-galeria
status: draft   # draft | approved | blocked
constitution_version: 1.0.0
created: 2026-11-23
---

# Plan · 029 Límite de 15 imágenes en la galería

## Enfoque técnico
El límite lo aplica el servicio de imágenes del backend al dar de alta (P8, P17). Para que contar y
guardar sean atómicos (CA7), el repositorio toma un **bloqueo con nombre de MySQL**
(`GET_LOCK('dentissa_galeria_alta', 5)`) en una conexión propia. Con el bloqueo tomado cuenta las
imágenes, inserta solo si hay menos de 15 y lo suelta en un `finally` que nunca convierte un alta guardada en error y siempre libera la
conexión. Si el alta se rechaza por cualquier motivo, se borra **solo el archivo que multer
escribió en esa petición** (`req.file`); la ruta de la imagen sale siempre de ese archivo, nunca
del cuerpo (CA2, /analyze A1). Editar y
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
| P9 Entrada validada y SQL parametrizado | ✅ | Las consultas nuevas (`GET_LOCK`, `COUNT`, `INSERT`, `RELEASE_LOCK`) llevan los valores en `?`. Campos permitidos del alta: `titulo` y `visible` del cuerpo; `imagen` solo de `req.file` (el del cuerpo se ignora, como en la spec 021) | test: `limite-galeria-concurrencia.test.js` → valores solo en los parámetros; `rutas-galeria.test.js` → `imagen` del cuerpo ignorado (TM6) |
| P10 Secretos fuera del repositorio | ✅ | No hay secretos nuevos | lint: gitleaks en CI |
| P11 Sin vulnerabilidades críticas o altas | ✅ | Línea base 2026-11-23: `npm audit --audit-level=high` sale con 0 en backend y frontend (backend con 20 moderadas previas) | test: npm audit y trivy en CI y en `/release` |
| P12 Modelo de amenazas en datos sensibles | ✅ | No toca datos sensibles, pero recibe archivos subidos: el modelo de amenazas va igual | manual: sección «Modelo de amenazas» revisada en `/analyze` |
| P13 Auditoría de datos sensibles | ❌ aceptado: el alta de imágenes es una acción administrativa que P13 manda registrar; queda sin evento por la excepción P13 vigente hasta el objetivo 3 (specs 027 y 028) — aprobado por el usuario el 2026-11-11 (`docs/specs/021-proteccion-cuentas-admin/plan.md`) | Sin evento nuevo; destino: objetivo 3, OB1 (/analyze A6) | — (llega con las specs 027 y 028) |
| P14 Correlación por petición | ✅ | El rechazo 409 pasa por los middlewares de la spec 026: lleva `X-Request-Id` y una línea «Petición atendida» | test: `rutas-galeria.test.js` → la respuesta 409 trae `X-Request-Id` |
| P15 Logs sin datos sensibles | ✅ | Sin logs nuevos. El error de `borrarArchivo` ya registra solo el `code` | test: `rutas-galeria.test.js` → los logs del 409 no contienen el título ni el nombre del archivo |
| P16 Accesibilidad WCAG 2.1 AA | ✅ | `aria-disabled` + `aria-describedby` en el botón, aviso con `role="status"` y contraste del aviso de 9,63:1 (`design.md`) | test: `galeria-limite.test.jsx` consulta el botón por rol y su descripción accesible, y calcula el contraste del aviso desde los tokens; manual: NVDA y teclado en `/admin/galeria` |
| P17 Sin lógica de negocio en las vistas | ✅ | La regla vive en `images.service`; el panel solo refleja el conteo y no impide nada que el servidor permita | test: `rutas-galeria.test.js` (CA8: se rechaza sin pasar por el panel) |
| P18 Metadatos por ruta indexable | ➖ | No cambia ninguna ruta indexable (`/galeria` igual, CA9) | — |
| P19 Noindex fuera de lo público | ➖ | `/admin/galeria` ya lleva `noindex` (spec 022) y no cambia | — |
| P20 La interfaz usa solo el sistema de diseño | ✅ | Las reglas CSS nuevas solo usan tokens de color (`--muted`, `--primary-50`, `--primary-100`, `--ink-2`) y `--radius-sm`; el relleno del aviso se añade antes a `system.md`. Alcance: solo las reglas nuevas; los literales previos del encabezado y de la galería siguen como DS1 y DS2 en el roadmap (decisión del usuario, 2026-11-23, /analyze A8) | test: `galeria-limite.test.jsx` → cada selector nuevo existe y no tiene colores literales (control positivo con un literal de ejemplo) |

## Cambios por módulo
| Módulo | Cambio | Riesgo |
|---|---|---|
| `backend/src/modules/images/images.limites.js` (nuevo) | `MAX_IMAGENES_GALERIA = 15` y el mensaje de rechazo de CA2 | bajo |
| `backend/src/modules/images/images.repository.js` | `crearImagenConLimite(datos, max, origen = pool)`: conexión propia, `GET_LOCK` con espera de 5 s, `COUNT(*)`, `INSERT` si `total < max`, y `RELEASE_LOCK` + `release()` en `finally`. Devuelve `{ creada, id }`, `{ creada: false, total }` o `{ bloqueo: false }`. Si `RELEASE_LOCK` lanza después de un `INSERT` correcto, devuelve igual `{ creada: true, id }`; `release()` corre siempre en un `finally` propio; `GET_LOCK` con `0` o `NULL` → `{ bloqueo: false }`. `createImagen` deja de usarse en el alta | medio: un bloqueo sin soltar frenaría las altas (TM4) |
| `backend/src/modules/images/images.controller.js` | `createImagen` pasa al servicio la ruta del archivo subido (`req.file`) aparte del cuerpo, y descarta `imagen` del cuerpo para que nunca llegue del cliente (TM6) | bajo |
| `backend/src/modules/images/images.service.js` | `createImagen(data, rutaArchivo)` valida `titulo`, `visible` y que haya archivo, y llama a `crearImagenConLimite` con esa ruta: 409 con el mensaje de CA2 si está llena; 503 «La galería está ocupada. Intenta de nuevo.» si no obtuvo el bloqueo. Ante cualquier error borra **solo** `rutaArchivo` y vuelve a lanzar. Devuelve el id como hoy (el 201 conserva su `payload`). `updateImagen` y `deleteImagen` sin cambios | bajo |
| `docs/design/system.md`, `docs/design/system.html` | Primera tarea: «Aviso informativo del panel» y `aria-disabled` en `EncabezadoModulo`. DS10 pasa a «parcial» | bajo |
| `frontend/src/utils/limitesGaleria.js` (nuevo) | `MAX_IMAGENES_GALERIA = 15` | bajo |
| `frontend/src/components/EncabezadoModulo.jsx` | Props opcionales `detalle` (línea bajo la descripción), `botonNoDisponible` y `idDescripcionBoton`. Con `botonNoDisponible`: `aria-disabled="true"`, `aria-describedby` y el clic no llama a `onBoton`. Sin esas props, el comportamiento y el DOM de las otras 13 páginas que lo usan (10 del panel y 3 del portal del paciente) no cambian | medio: componente compartido (lo cubre el test de no regresión) |
| `frontend/src/styles/adminpanel.css` | `.encabezado-detalle` con `color: var(--muted)` (sin copiar el literal de `.encabezado-descripcion`), `.encabezado-btn[aria-disabled="true"]` (mismos valores que el `:disabled` actual, que no tiene colores) y `.aviso-panel` con tokens de color y el relleno documentado en `system.md` | bajo |
| `frontend/src/pages/admin/Admingaleria.jsx` | Contador `${imagenes.length} de ${MAX} imágenes` en `detalle`, `botonNoDisponible` con 15 o más, aviso `role="status"` con `id` entre el encabezado y los filtros, y `abrirNueva` que no abre el modal con la galería llena. El error del servidor (409/503) sale en el `errorForm` de hoy y el panel vuelve a pedir `/imagenes` para corregir el contador. Si la lista no carga, no se muestran contador ni aviso (CA5) | bajo |

## Contratos y datos
**`POST /api/v1/imagenes`** (Administrador, Asistente): la respuesta 201 no cambia (su `payload`
sigue siendo el id). El campo `imagen` del cuerpo se ignora: la ruta sale solo del archivo subido.
Respuestas nuevas, con el cuerpo completo que ya arma el errorHandler (sin tocar `AppError`):

| Caso | Código | Cuerpo |
|---|---|---|
| Galería con 15 o más | `409` | `{ "success": false, "status": "fail", "message": "La galería admite como máximo 15 imágenes. Elimina una para agregar otra." }` |
| Bloqueo no obtenido en 5 s | `503` | `{ "success": false, "status": "error", "message": "La galería está ocupada. Intenta de nuevo." }` |

En los dos casos, y en los 400 de hoy, se borra la foto subida en esa petición (decisión del
usuario, 2026-11-23, /analyze A10); nunca otra ruta.

`PUT /imagenes/:id`, `DELETE /imagenes/:id`, `GET /imagenes` y `GET /imagenes/publicas` no
cambian. El panel cuenta con `GET /imagenes`, que ya trae todas, visibles y ocultas.

**Datos:** sin migración. El bloqueo con nombre no deja nada guardado.

**Panel `/admin/galeria`:**

| Estado | Qué se ve | Accesibilidad |
|---|---|---|
| Con sitio (N < 15) | «N de 15 imágenes» bajo la descripción; «Nueva imagen» activo | el contador es texto normal del encabezado |
| Llena (N ≥ 15) | «15 de 15 imágenes», botón atenuado y aviso «Llegaste al máximo de 15 imágenes. Elimina una para agregar otra.» | botón enfocable con `aria-disabled="true"` y `aria-describedby` → aviso; aviso con `role="status"` |
| Rechazo del servidor | mensaje del 409/503 en el error del modal; la lista se vuelve a pedir | `<p role="alert">` de hoy |
| Lista sin cargar | ni contador ni aviso; botón como hoy | — |

## Estrategia de pruebas
- **Servicio (Jest, repositorio simulado):** `backend/tests/galeria/limite-galeria.test.js`.
  - Con 14 se crea y devuelve el id.
  - Con 15: 409 con el mensaje exacto y `borrarArchivo` llamado solo con la ruta del archivo subido.
  - Un `imagen` en el cuerpo nunca llega al repositorio ni a `borrarArchivo` (TM6).
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
    - si `GET_LOCK` devuelve `0` o `NULL` → `{ bloqueo: false }`, sin `COUNT`;
    - si `RELEASE_LOCK` lanza después de un `INSERT` correcto → `{ creada: true, id }` y `release()`
      llamado;
    - los valores van solo en los parámetros.
- **HTTP (Jest + supertest):** `backend/tests/galeria/rutas-galeria.test.js`, con el repositorio
  simulado y multer simulado como en `rutas-usuarios.test.js`.
  - Sin token → 401; Paciente → 403.
  - Con 14 → 201 con el mismo `payload` (id) de hoy.
  - Asistente y Administrador con 15 → 409 con el cuerpo exacto y borrado del archivo subido (CA8).
  - 503 con su cuerpo exacto.
  - Sin archivo y con `imagen: '/uploads/ajeno.jpg'` en el cuerpo, con 15 y también sin título:
    `borrarArchivo` nunca recibe esa ruta y el repositorio no recibe `imagen` del cuerpo (TM6).
  - Con un título distintivo: existe la línea «Petición atendida» con `status` 409 y el
    `request_id` de la cabecera, y el título no aparece en ninguna línea capturada.
- **Panel (Vitest + Testing Library):** `frontend/tests/galeria-limite.test.jsx`, con `api`
  simulado.
  - Con 3: «3 de 15 imágenes» y el botón disponible.
  - Con 15: botón con `aria-disabled="true"`, su descripción accesible es el aviso, el clic no
    abre el diálogo y el aviso tiene `role="status"`.
  - Agregar y eliminar actualizan el contador sin recargar.
  - Un 409 al guardar muestra el mensaje en el `role="alert"` del modal y vuelve a pedir
    `/imagenes`.
  - Si `/imagenes` falla, no se muestran el contador ni el aviso.
  - Contraste `--ink-2` sobre `--primary-50` ≥ 4,5:1, leído de `global.css`.
  - Cada selector CSS nuevo existe y no tiene literales de color.
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
| TM3 | Denial of service: altas rechazadas que dejan sus fotos en disco hasta llenarlo | A06:2025 Insecure Design | `images.service` | Ante cualquier error del alta, `borrarArchivo` con la ruta del archivo subido en esa petición | `limite-galeria.test.js` (409, 503 y 400 borran el archivo subido) |
| TM4 | Denial of service: un bloqueo sin soltar deja las altas colgadas | A10:2025 Mishandling of Exceptional Conditions | `images.repository` | `RELEASE_LOCK` y `release()` en `finally`; espera máxima de 5 s y 503. MySQL suelta el bloqueo si la conexión se cierra. Riesgo residual aceptado: cada alta en espera retiene una conexión del pool hasta 5 s; con dos roles del personal no se espera una ráfaga (/analyze A15) | `limite-galeria-concurrencia.test.js` (el `INSERT` que lanza igual suelta; `GET_LOCK` 0 → 503) |
| TM6 | Tampering: un alta envía `imagen=/uploads/<archivo ajeno>` en el cuerpo para que el rechazo borre ese archivo, o para guardar una ruta ajena | A01:2025 Broken Access Control | `images.controller`, `images.service` | La ruta sale solo de `req.file`; `imagen` del cuerpo se descarta; solo se borra el archivo subido en esa petición | `rutas-galeria.test.js` y `limite-galeria.test.js` (TM6) |
| TM5 | Elevation: un Paciente o alguien sin sesión da de alta imágenes | A01:2025 Broken Access Control | `images.routes` | `verifyToken` + `authorizeRoles` de hoy, sin cambios | `rutas-galeria.test.js` (401, 403) |

## Trazabilidad
| Criterio de aceptación | Cambio(s) | Test(s) |
|---|---|---|
| CA1: con menos de 15, el alta funciona | `images.service`, `images.repository` | unit `limite-galeria.test.js` «con 14 se crea y devuelve el id»; HTTP `rutas-galeria.test.js` «con 14 → 201 con el mismo payload» |
| CA2: con 15, rechazo con el mensaje, sigue en 15 y la foto no queda | `images.service`, `images.repository`, `images.limites.js` | unit `limite-galeria.test.js` «con 15 → 409 y borra el archivo»; concurrencia «con 15 no hay INSERT»; Vitest `galeria-limite.test.jsx` «el 409 sale en el alert del modal» |
| CA3: editar o reemplazar con 15 se permite | `images.service` (sin cambio en `updateImagen`) | unit `limite-galeria.test.js` «update con 15 no consulta el conteo y guarda» |
| CA4: tras eliminar, se puede agregar | `images.service` | unit `limite-galeria.test.js` «tras eliminar, otra alta pasa»; Vitest «eliminar actualiza el contador y reactiva el botón» |
| CA5: «N de 15 imágenes» actualizado sin recargar; sin lista, sin contador | `Admingaleria.jsx`, `EncabezadoModulo.jsx`, `limitesGaleria.js` | Vitest `galeria-limite.test.jsx` «3 de 15», «agregar y eliminar actualizan», «si /imagenes falla, sin contador ni aviso» · verificación manual: capturas a 390 y 1440 px (K1) |
| CA6: con 15, acción no disponible, aviso y anuncio al lector | `Admingaleria.jsx`, `EncabezadoModulo.jsx`, `adminpanel.css` | Vitest `galeria-limite.test.jsx` «aria-disabled, descripción accesible = aviso, el clic no abre, role=status» · verificación manual: capturas (K2) y NVDA + teclado en `/admin/galeria` (K3) |
| CA7 (abuso): dos altas simultáneas con 14 → solo una | `images.repository` | concurrencia `limite-galeria-concurrencia.test.js` «una 201 y una 409», «GET_LOCK → COUNT → INSERT → RELEASE_LOCK en la misma conexión» · verificación manual: dos `curl` simultáneos contra MySQL de Docker local |
| CA8 (abuso): alta sin pasar por el panel con 15 → rechazo | `images.service` | HTTP `rutas-galeria.test.js` «Asistente y Administrador con 15 → 409» |
| CA9: la galería pública no cambia | ninguno en `Gallery.jsx` | Vitest `galeria-estados.test.jsx` (regresión) y `galeria-limite.test.jsx` «la página pública no muestra el límite» |
| TM1 | `images.repository` | `limite-galeria-concurrencia.test.js` |
| TM2 | `images.service` | `rutas-galeria.test.js` |
| TM3 | `images.service` | `limite-galeria.test.js` |
| TM4 | `images.repository` | `limite-galeria-concurrencia.test.js` |
| TM5 | `images.routes` | `rutas-galeria.test.js` |
| TM6 | `images.controller`, `images.service` | `rutas-galeria.test.js`, `limite-galeria.test.js` |
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
- **Borrar la foto ante cualquier rechazo del alta**, no solo el del límite (decisión del usuario,
  2026-11-23, /analyze A10). Solo se borra el archivo subido en esa petición: la ruta nunca sale
  del cuerpo (/analyze A1, TM6), como ya fijó la spec 021 para las fotos de usuario.
- **El `finally` del bloqueo no cambia el resultado del alta** (/analyze A3): un fallo de
  `RELEASE_LOCK` después de un `INSERT` correcto no se propaga (MySQL suelta el bloqueo al cerrar
  la conexión), y `release()` corre siempre.
- **El 15 se duplica en backend y frontend**, como los 6 MB, con un test que exige que coincidan.
  No hay workspaces para compartir código entre paquetes, y cambiar `GET /imagenes` para enviar el
  límite rompería su contrato.
- **`aria-disabled` en vez de `disabled`:** viene de `design.md` (CA6).

## Impacto en arquitectura
- `docs/architecture.md`: nada estructural. En T090, añadir en el módulo `images` la mención del
  límite de altas y del bloqueo con nombre.
- `docs/design/system.md`: el aviso informativo del panel, y la línea de detalle y
  `aria-disabled` de `EncabezadoModulo` (primera tarea). DS10 no cambia de estado.

## Riesgos y mitigaciones
- **Un bloqueo que no se suelta:** `finally` con `RELEASE_LOCK` y `release()`; si la conexión
  muere, MySQL lo suelta solo. Los tests de TM4 lo cubren.
- **Regresión en las otras 13 páginas con `EncabezadoModulo` (10 del panel y 3 del portal del paciente):** las props nuevas son opcionales,
  y un test de no regresión comprueba el comportamiento sin ellas.
- **Que el contador y el servidor no coincidan** (otra persona agregó desde otra pestaña): el
  servidor manda. El 409 se muestra en el modal y el panel vuelve a pedir la lista para corregir
  el contador (test en `galeria-limite.test.jsx`, caso del 409).
- **Riesgos documentados:**
  - **RS5** (la subida de archivos confía en el cliente): esta spec toca el flujo de subida pero no
    lo corrige. RS5.a y RS5.b quedan **fuera** de alcance porque no cambian el tipo ni la extensión
    de lo que se guarda → siguen pendientes en `docs/security.md` (/analyze A7).
  - **DS10** no cambia: el `aria-disabled` de `EncabezadoModulo` es una mejora propia del
    componente. La trampa de foco del modal y el `:disabled` de `.dt-btn` siguen pendientes
    (/analyze A5).
  - **DS1 y DS2:** los literales previos del encabezado y de la galería quedan fuera (decisión del
    usuario, /analyze A8) → siguen en `docs/design/system.md` y el roadmap.
  - **OB1** (auditoría): fuera por la excepción P13 → objetivo 3.
