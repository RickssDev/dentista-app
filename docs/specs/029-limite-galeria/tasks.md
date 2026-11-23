---
spec: 029-limite-galeria
plan: plan.md
impl_base: 567c0b9
status: approved
---

# Tareas · 029 Límite de 15 imágenes en la galería

Formato:
`- [ ] T### [P] <verbo + qué> — <archivos> — hecho cuando: <criterio> — cubre: CA# — depende: T###`
- T001–T089: trabajo. T090–T099: reservadas.
- `[P]` = paralelizable con las demás `[P]` de su grupo una vez cumplidas sus dependencias (no
  comparte archivos con otra tarea abierta).
- Lo generado por un comando cuenta como un archivo: `android/ (generado por npx cap add android)`.
- `[-]` = obsoleta (`— obsoleta: <motivo> (AAAA-MM-DD)`): no cuenta como abierta ni como hecha.
- Bajo una tarea: `  - nota: …`, `  - bloqueo: AAAA-MM-DD — <qué falta> — <skill a ejecutar>`.
- La comprobación a mano va en la tarea que construye la pieza:
  `hecho cuando: T010 pasa · verificación manual: <qué, dónde, contra qué>`.

## Constitution Check
Revisado contra el Constitution Check de [plan.md](plan.md). Lo que el desglose podría romper:
- **P2:** cada tarea de implementación depende de la tarea de test que la cubre; todos los tests
  van antes, en la fase de Tests. ✅
- **P3:** ninguna tarea toca `package.json`. ✅
- **P8:** la tarea de servicio (T021) depende del test HTTP por rol (T012). ✅
- **P9:** el test de parámetros (T011) va antes del repositorio (T020). ✅
- **P16 y P20:** la primera tarea (T001) incorpora el aviso al sistema de diseño. Las tareas de UI
  dependen de ella, y T013 comprueba contraste y que no haya literales de color. ✅
- **P7, P13, P18, P19:** ➖, como en el plan; ninguna tarea toca esquema, auditoría ni rutas
  públicas. ➖

## Preparación
- [x] T001 Incorporar al sistema de diseño el «Aviso informativo del panel» y `aria-disabled` en `EncabezadoModulo` — `docs/design/system.md`, `docs/design/system.html` — hecho cuando: «Aviso, diálogo y mensajes» describe el aviso (fondo `--primary-50`, borde `--primary-100`, texto `--ink-2`, `role="status"`, contraste 9,63:1); «Aviso» incluye el relleno 12px 16px, el borde de 1px y el radio `--radius-sm`; «Lista o tarjeta» dice que `EncabezadoModulo` admite una línea de detalle (texto `--muted`) y el botón con `aria-disabled` + `aria-describedby`, como mejora propia; DS10 **sigue «pendiente»** sin cambios (A5); `system.html` muestra el aviso; hay una fila en «Decisiones» que cita la spec 029
  - nota: el relleno del aviso usa los tokens existentes `--space-3` y `--space-4` (12px y 16px): no hizo falta añadir valores al sistema. `system.html` gana las variantes `--primary-50`, `--primary-100` e `--ink-2` en sus tokens y una muestra del aviso. DS10 sigue «pendiente» (A5)
- [x] T002 [P] Crear la constante y el mensaje del límite en el backend — `backend/src/modules/images/images.limites.js` — hecho cuando: exporta `MAX_IMAGENES_GALERIA = 15`, `MENSAJE_GALERIA_LLENA` con el texto exacto de CA2 y `MENSAJE_GALERIA_OCUPADA` («La galería está ocupada. Intenta de nuevo.») — cubre: CA2
- [x] T003 [P] Crear la constante del límite en el frontend — `frontend/src/utils/limitesGaleria.js` — hecho cuando: exporta `MAX_IMAGENES_GALERIA = 15` — cubre: CA5

## Tests (antes de implementar)
- [x] T010 [P] Tests del servicio de imágenes con el repositorio simulado — `backend/tests/galeria/limite-galeria.test.js` — hecho cuando: fallan por la razón esperada (hoy no hay límite ni borrado). Casos: con 14 se crea y devuelve el id (A9); con 15 → `AppError` 409 con `MENSAJE_GALERIA_LLENA` y `borrarArchivo` solo con la ruta del archivo subido; `{ bloqueo: false }` → 503 con `MENSAJE_GALERIA_OCUPADA` y archivo subido borrado; 400 por campos faltantes → archivo subido borrado; un `imagen` en `data` (cuerpo) nunca llega a `crearImagenConLimite` ni a `borrarArchivo`, y sin archivo subido → 400 sin llamar a `borrarArchivo` (TM6, A1); `updateImagen` con 15 no llama a `crearImagenConLimite` y guarda; tras `deleteImagen`, otra alta pasa — cubre: CA1, CA2, CA3, CA4 — depende: T002
  - nota: 9 de 10 fallan por la razón esperada (el servicio no aplica límite ni borra la foto). El caso CA3 pasa desde el principio porque editar no cambia; comprobado rompiendo `repo.updateImagen` en el servicio: falla, y restaurado pasa
- [x] T011 [P] Tests de concurrencia y del repositorio con conexión falsa — `backend/tests/galeria/limite-galeria-concurrencia.test.js` — hecho cuando: fallan por la razón esperada (no existe `crearImagenConLimite`). Casos del servicio, con un repositorio falso que serializa como el bloqueo: con 14, dos altas simultáneas → una crea y otra 409, total 15. Casos del repositorio, con un pool falso inyectado como `origen`, cuyo `getConnection()` devuelve la conexión falsa (A11): orden `GET_LOCK` → `COUNT` → `INSERT` → `RELEASE_LOCK` en la misma conexión y `release()` al final; con 15 no hay `INSERT`; si el `INSERT` lanza, igual hay `RELEASE_LOCK` y `release()`; `GET_LOCK` `0` o `NULL` → `{ bloqueo: false }` sin `COUNT`; si `RELEASE_LOCK` lanza después de un `INSERT` correcto → devuelve `{ creada: true, id }`, la conexión se cierra con `destroy()` y no se devuelve al pool con `release()` (A3, A18); el título, la ruta y la visibilidad van solo en los parámetros, nunca en el texto del SQL — cubre: CA7 — depende: T002
  - nota: 8 de 8 fallan por la razón esperada (no existe `crearImagenConLimite`; el servicio no aplica el límite). A11: el repositorio recibe un pool falso cuyo `getConnection()` devuelve la conexión falsa
- [x] T012 [P] Tests HTTP de `POST` y `PUT` de `/api/v1/imagenes` con repositorio, multer y `borrarArchivo` simulados (como `rutas-usuarios.test.js`) — `backend/tests/galeria/rutas-galeria.test.js` — hecho cuando: fallan por la razón esperada en los casos del límite y pasan los de permisos de hoy. Casos: sin token 401; Paciente 403; con 14 → 201 con el mismo `payload` (id) de hoy (A9); Asistente y Administrador con 15 → 409 con el cuerpo exacto `{ success: false, status: "fail", message: <CA2> }` y `borrarArchivo` con la ruta del archivo subido; 503 con el cuerpo exacto `{ success: false, status: "error", message: <ocupada> }` (A2); TM6, cada caso con su código (A1, A17, A20): alta sin archivo con `imagen: '/uploads/ajeno.jpg'` en el cuerpo → 400 y `borrarArchivo` no recibe esa ruta; alta con archivo subido e `imagen` ajena en el cuerpo, con 14 → 201 y el repositorio recibe la ruta del archivo subido; lo mismo con 15 → 409 y `borrarArchivo` recibe solo la ruta del archivo subido; `PUT` sin archivo, con un título nuevo e `imagen` ajena → 200 y `updateImagen` del repositorio recibe el título pero no `imagen`; con un título distintivo, existe la línea «Petición atendida» con `status` 409 y el mismo `request_id` que la cabecera `X-Request-Id`, y ni el título ni el nombre del archivo subido aparecen en ninguna línea capturada (A13, A21). Sin tocar `AppError` ni el errorHandler — cubre: CA8 — depende: T002
  - nota: 9 de 12 fallan por la razón esperada. Pasan desde el principio los dos de permisos (TM5) y el de alta sin archivo ni título
  - nota: TM5 comprobado rompiendo la ruta: sin `authorizeRoles`, el caso de Paciente falla; sin `verifyToken` ni `authorizeRoles`, falla el de sin token (`authorizeRoles` sola ya responde 401). Restaurado, pasan
  - nota: el caso «sin archivo ni título con imagen ajena» se comprobará rompiendo el control en T021, porque el borrado aún no existe
- [x] T013 [P] Tests del panel de la galería con `api` simulado — `frontend/tests/galeria-limite.test.jsx` — hecho cuando: fallan por la razón esperada (no hay contador ni aviso). Casos:
  - con 3: «3 de 15 imágenes» y el botón «Nueva imagen» sin `aria-disabled`;
  - con 15: el botón tiene `aria-disabled="true"`, su descripción accesible es el texto del aviso, el clic no abre el diálogo y el aviso tiene `role="status"`;
  - agregar una imagen y eliminar otra actualizan el contador sin recargar, y eliminar con 15 reactiva el botón;
  - un 409 al guardar muestra el mensaje en el `role="alert"` del modal y vuelve a pedir `/imagenes`;
  - si `/imagenes` falla, no se muestran el contador ni el aviso, y el botón no lleva `aria-disabled` (A16);
  - contraste `--ink-2` sobre `--primary-50` ≥ 4,5:1, leído de `src/styles/home/global.css`;
  - las reglas `.aviso-panel`, `.encabezado-detalle` y `.encabezado-btn[aria-disabled="true"]` de `adminpanel.css` **existen** y no tienen literales de color, con un control positivo que detecta un literal de ejemplo (A4);
  - `MAX_IMAGENES_GALERIA` coincide con el valor de `backend/src/modules/images/images.limites.js`;
  - la página pública `Gallery` con 15 imágenes no muestra «de 15».
  — cubre: CA2, CA4, CA5, CA6, CA9 — depende: T002, T003
  - nota: 7 de 12 fallan por la razón esperada (no hay contador, aviso ni reglas CSS); dos corridas iguales
  - nota: comprobados rompiendo lo protegido los que pasan desde el principio: contraste (`--ink-2` cambiado a un gris claro), constante compartida (15 → 16 en el frontend) y galería pública (texto «de N imágenes» añadido a `Gallery.jsx`); todos fallan rotos y pasan restaurados. El control positivo de literales es su propia comprobación. El caso «lista sin cargar» (A16) pasa hoy porque no hay contador: se comprueba rompiéndolo en T023
  - nota: CA9: la página pública ya muestra «Mostrando N de 15» (paginación); el test busca «de 15 imágenes», el texto del contador del panel
  - nota: jsdom no da `import.meta.url` como ruta de archivo: se leen los CSS con `process.cwd()`, como `galeria-estados.test.jsx`
- [x] T014 [P] Test de no regresión de `EncabezadoModulo` sin las props nuevas — `frontend/tests/encabezado-modulo.test.jsx` — hecho cuando: pasa antes del cambio (caracterización) y comprueba que, sin `detalle` ni `botonNoDisponible`, el botón no lleva `aria-disabled` ni `aria-describedby`, el clic llama a `onBoton` y no se pinta la línea de detalle; los casos con `botonNoDisponible` fallan por la razón esperada — cubre: CA6
  - nota: la caracterización (sin props nuevas) pasa antes del cambio; comprobada rompiendo el `onClick` del botón: falla, y restaurado pasa. Los dos casos con `detalle` y `botonNoDisponible` fallan por la razón esperada; dos corridas iguales

## Implementación
- [x] T020 Añadir `crearImagenConLimite(datos, max, origen = pool)` al repositorio — `backend/src/modules/images/images.repository.js` — hecho cuando: pasan los casos del repositorio de T011. Hace `GET_LOCK('dentissa_galeria_alta', 5)` en una conexión propia; con el bloqueo, `SELECT COUNT(*) AS total FROM imagenes` e `INSERT` solo si `total < max`; en `finally`, `RELEASE_LOCK` y `release()`; si `RELEASE_LOCK` falla después de un `INSERT` correcto, no se propaga y la conexión se cierra con `destroy()` en lugar de `release()` (A18); `GET_LOCK` con `0` o `NULL` → sin bloqueo. Devuelve `{ creada: true, id }`, `{ creada: false, total }` o `{ bloqueo: false }`. Todos los valores en `?` — cubre: CA2, CA7 — depende: T011
  - nota: pasan los 7 casos del repositorio de T011 (el de CA7 es del servicio: T021)
  - nota: controles comprobados rompiéndolos: sin `destroy()` falla A18; sin `RELEASE_LOCK` fallan 3 casos de TM4; sin la comparación con el máximo falla CA2. Restaurado, pasan
  - nota: GET_LOCK con `NULL` se trata como sin bloqueo con `Number(bloqueo) !== 1`
- [x] T021 Aplicar el límite en el alta, tomar la imagen solo del archivo subido y borrarlo ante cualquier rechazo — `backend/src/modules/images/images.service.js`, `backend/src/modules/images/images.controller.js` — hecho cuando: pasan T010, T012 y los casos del servicio de T011. El controller descarta `imagen` del cuerpo en el alta y en la edición, y solo la toma de `req.file`; en el alta pasa esa ruta al servicio aparte (TM6, A17). El servicio usa `crearImagenConLimite` con `MAX_IMAGENES_GALERIA`: `creada: false` → `AppError(MENSAJE_GALERIA_LLENA, 409)`; `bloqueo: false` → `AppError(MENSAJE_GALERIA_OCUPADA, 503)`; devuelve el id como hoy. Cualquier error del alta borra **solo** la ruta del archivo subido y vuelve a lanzar. `updateImagen` y `deleteImagen` sin cambios, y `images.routes.js` sin cambios: conserva `verifyToken` + `authorizeRoles` (TM5) · verificación manual: con el MySQL de Docker local y 14 imágenes, dos `curl` simultáneos de alta dejan 15, uno con 201 y otro con 409 — cubre: CA1, CA2, CA3, CA4, CA7, CA8 — depende: T010, T012, T020
  - nota: pasan T010, T011 y T012 (30 pruebas de `tests/galeria`). Suite del backend: 35 suites, 419 pasan y 5 `todo`; lint con solo el error previo de `faqs.service.js` (`file` sin usar), ajeno a la spec
  - nota: controles comprobados rompiéndolos: sin descartar `imagen` del cuerpo en el controller falla el caso `PUT` (A17; en el alta el servicio ya ignora el cuerpo, doble defensa); borrando `data.imagen` como en el diseño defectuoso de A1 falla «sin archivo ni título» (pendiente de T012); sin borrar la foto subida fallan 5 (TM3); sin el 409 fallan 2 (TM2, CA8). Restaurado, pasan
  - nota: verificación manual 2026-11-23 (agente), equivalente a los dos `curl` porque entrar al entorno local exige leer `.env`: MySQL 8 desechable (puerto 3399) con la tabla `imagenes` del esquema y el repositorio real. Con 14 y 2 altas simultáneas → 1 creada y 1 rechazada, total 15; con 14 y 10 → 1 y 9, total 15; con 0 y 20 → 15 y 5, total 15; con 13 y 5 → 2 y 3, total 15; el bloqueo queda libre al terminar. Control positivo: sin el bloqueo, los totales llegan a 16, 18, 20 y 18
- [x] T022 Añadir a `EncabezadoModulo` la línea de detalle y el botón no disponible, con sus estilos — `frontend/src/components/EncabezadoModulo.jsx`, `frontend/src/styles/adminpanel.css` — hecho cuando: pasa T014 completo. Props opcionales `detalle`, `botonNoDisponible` e `idDescripcionBoton`; con `botonNoDisponible`, `aria-disabled="true"` y `aria-describedby`, y el clic no llama a `onBoton`. CSS: `.encabezado-detalle` con `color: var(--muted)` (sin copiar el literal de `.encabezado-descripcion`), `.encabezado-btn[aria-disabled="true"]` con los mismos valores que `:disabled` y `.aviso-panel` con `var(--primary-50)`, borde de 1px `var(--primary-100)`, `var(--ink-2)`, `var(--radius-sm)` y el relleno documentado en T001 — cubre: CA5, CA6 — depende: T001, T014
  - nota: pasa T014 (3 de 3, dos corridas) y los casos de reglas CSS y tokens de T013; el control comprobado rompiéndolo: si el clic no se bloquea con `botonNoDisponible`, falla. Suite del frontend: solo fallan los 4 casos del panel de `galeria-limite.test.jsx`, que cierra T023
  - nota: `.encabezado-detalle` como selector simple (ninguna regla con más especificidad le gana); el aviso usa `--space-3`/`--space-4`, `--radius-sm` y borde de 1px (P20 admite 1px)
- [x] T023 Mostrar el contador, el aviso y el bloqueo de alta en el panel de la galería — `frontend/src/pages/admin/Admingaleria.jsx` — hecho cuando: pasa T013 y siguen en verde `galeria-estados.test.jsx` y `permisos-asistente.test.jsx`. Pasa `detalle={`${imagenes.length} de ${MAX_IMAGENES_GALERIA} imágenes`}` y `botonNoDisponible` con 15 o más; aviso `.aviso-panel` con `role="status"` e `id` entre el encabezado y los filtros; `abrirNueva` no abre el modal con la galería llena; el error del servidor sale en `errorForm` y se vuelve a pedir la lista; si la lista no carga, no pasa `detalle` ni `botonNoDisponible` ni muestra el aviso (A16) · verificación manual: capturas de `/admin/galeria` a 390 y 1440 px con 3 y con 15 imágenes, comparadas con `design.md` (contador visible sin desplazarse, botón atenuado y aviso) (K1, K2); con NVDA y teclado, el botón se alcanza con Tab y se anuncia «no disponible» con el texto del aviso (K3) — cubre: CA2, CA4, CA5, CA6, CA9 — depende: T003, T013, T022
  - nota: código y tests listos: T013 12/12 en dos corridas; siguen en verde `galeria-estados.test.jsx` y `permisos-asistente.test.jsx` (frontend 28 archivos, 243 pruebas); build en verde; lint con los 7 errores previos. Comprobados rompiéndolos: A16 (lista sin cargar) y la recarga tras un 409
  - nota: desbloqueada 2026-11-23 — el usuario hizo la verificación manual
  - nota: verificación manual OK 2026-11-23 (usuario): frontend de la rama en Vite contra la API local, con 1 y 15 imágenes (14 de prueba insertadas y borradas después). Con 15: «15 de 15 imágenes», botón «Nueva imagen» atenuado que no abre nada y el aviso «Llegaste al máximo de 15 imágenes. Elimina una para agregar otra.», a 1440 y 390 px; el lector de pantalla lo anuncia; al eliminar una vuelve a «14 de 15» y el botón responde

## Correcciones de /review (ronda 1)
- [x] T030 Tests HTTP de `PUT /api/v1/imagenes/:id`: permisos, reemplazo de foto y visibilidad con la galería llena — `backend/tests/galeria/rutas-galeria.test.js` — hecho cuando: sin token → 401 y Paciente → 403 sin llamar a `repo.updateImagen`; `PUT` con archivo subido e `imagen` ajena en el cuerpo, con 15 → 200, `repo.updateImagen` recibe `imagen: '/uploads/subida-q29.jpg'`, `borrarArchivo` se llama con la foto anterior y nunca con la ajena, y `crearImagenConLimite` no se llama; `PUT` solo de `visible` con 15 → 200 y `updateImagen` recibe `visible`. Como el comportamiento ya existe, cada caso se comprueba rompiendo lo que protege (quitar `authorizeRoles` del `PUT`, tomar `imagen` del cuerpo en el controller) — cubre: CA3
  - nota: añadida por /review: R1, R2
  - nota: R1, R2: 4 casos nuevos; pasan porque el comportamiento ya existe. Comprobados rompiendo lo protegido: sin `authorizeRoles` en el `PUT` falla el de Paciente; sin `verifyToken` ni `authorizeRoles` falla el de sin token; tomando `imagen` del cuerpo en el controller falla el de reemplazo. Restaurado, `tests/galeria` 34/34
- [x] T031 Endurecer los tests del servicio y del repositorio — `backend/tests/galeria/limite-galeria.test.js`, `backend/tests/galeria/limite-galeria-concurrencia.test.js` — hecho cuando: el test de servicio «CA7» se llama «el servicio convierte el rechazo del repositorio en 409» y su comentario remite a TM1 y a la verificación con MySQL real; CA3 afirma que `updateImagen` con 15 devuelve la imagen actualizada en lugar de las dos aserciones triviales; CA4 usa `toBe(114)`; el caso del `INSERT` que falla afirma que no hay `destroy()`; caso nuevo con `INSERT` y `RELEASE_LOCK` fallando: rechaza con el error del `INSERT`, `destroy()` una vez y sin `release()`. Cada caso nuevo o endurecido se comprueba rompiendo lo protegido — cubre: CA3, CA4, CA7
  - nota: añadida por /review: R4, R5, R10
  - nota: R4: test de servicio renombrado, con comentario que remite a TM1 y a la verificación con MySQL real. R5: CA3 afirma la imagen devuelta y CA4 `toBe(114)`. R10: el `INSERT` que falla afirma que no hay `destroy()`, y hay un caso combinado. 35/35
  - nota: comprobados rompiendo lo protegido: sin `cerrar = true` falla el caso combinado; con `destroy()` siempre falla el del `INSERT`; si `updateImagen` no devuelve nada falla CA3. Restaurado, pasan
- [x] T032 Detectar en el test de P20 también espaciados, radios, sombras y duraciones literales — `frontend/tests/galeria-limite.test.jsx` — hecho cuando: el test de las reglas nuevas falla con un valor `px`, `rem`, `em`, `ms` o `s` literal, salvo `0` y el `1px` del borde que documenta `system.md`; tiene un control positivo con un espaciado literal de ejemplo; y pasa con las reglas actuales — cubre: CA6
  - nota: añadida por /review: R3
  - nota: R3: el test detecta también medidas con unidad (`px`, `rem`, `em`, `ms`, `s`) fuera de `var(...)`, admitiendo `0` y el `1px` de los bordes; control positivo con margen, radio y duración literales. 13/13 en dos corridas
  - nota: comprobado rompiéndolo: con `padding: 12px` en `.aviso-panel` falla; restaurado, pasa
- [ ] T033 Quitar `createImagen` del repositorio, ya sin uso, y de los mocks de los tests — `backend/src/modules/images/images.repository.js`, `backend/tests/galeria/limite-galeria.test.js`, `backend/tests/galeria/rutas-galeria.test.js` — hecho cuando: `grep -rn "createImagen\b" backend/src` solo encuentra el servicio y el controller (que llaman a `crearImagenConLimite`), y `tests/galeria` sigue en verde — cubre: CA2 — depende: T031
  - nota: añadida por /review: R6
- [ ] T034 Test: si `RELEASE_LOCK` falla, queda un aviso en el log sin SQL ni valores — `backend/tests/galeria/limite-galeria-concurrencia.test.js` — hecho cuando: falla por la razón esperada (hoy no hay log): con `fallaRelease`, la captura del logger tiene una línea `warn` «No se pudo soltar el bloqueo de la galería» con el `code` del error y sin el título, la ruta ni el texto del SQL — cubre: CA7 — depende: T031
  - nota: añadida por /review: R8
- [ ] T035 Registrar el fallo de `RELEASE_LOCK` con `logger.warn` — `backend/src/modules/images/images.repository.js` — hecho cuando: pasa T034 y el resto de `tests/galeria` — cubre: CA7 — depende: T033, T034
  - nota: añadida por /review: R8
- [ ] T036 Test: el `:hover` no cambia el botón no disponible — `frontend/tests/galeria-limite.test.jsx` — hecho cuando: falla por la razón esperada: ninguna regla `:hover` de `.encabezado-btn` en `adminpanel.css` se aplica a `[aria-disabled="true"]` (el selector excluye ese estado) — cubre: CA6 — depende: T032
  - nota: añadida por /review: R11
- [ ] T037 Limitar el `:hover` de `.encabezado-btn` a los botones disponibles — `frontend/src/styles/adminpanel.css` — hecho cuando: pasa T036 y el resto de `galeria-limite.test.jsx`; el literal previo del `:hover` sigue igual (deuda DS2, fuera de alcance por la decisión A8) — cubre: CA6 — depende: T036
  - nota: añadida por /review: R11

## Integración y documentación
- [x] T090 Actualizar `docs/architecture.md` si cambió la estructura — `docs/architecture.md` — hecho cuando: en el módulo `images` se menciona el límite de 15 altas, el bloqueo con nombre `dentissa_galeria_alta` y el borrado de la foto en los rechazos
  - nota: módulo `images` con el límite, el bloqueo con nombre, la ruta solo del archivo y el borrado en rechazos; la deuda de lint pasa a 1 error en el backend (el de `images.service.js` desapareció) y 12 problemas en el frontend
- [x] T091 Actualizar `docs/deployment.md` y `docs/observability.md` si cambiaron variables, entornos, pasos de deploy, logs, eventos de auditoría o métricas — hecho cuando: confirmado que no cambian (sin variables, logs ni eventos nuevos), anotado como nota
  - nota: sin cambios: no hay variables, entornos, pasos de despliegue, logs, eventos de auditoría ni métricas nuevos. El 409 y el 503 quedan en la línea «Petición atendida» de la spec 026
- [ ] T092 Marcar spec como `implemented`
  - nota: 9 de 9 criterios marcados, cada uno con su test en verde: backend 35 suites, 419 pruebas y 5 `todo`; frontend 28 archivos y 243 pruebas. Build en verde; lint con solo los errores previos (backend 1, frontend 7). gitleaks no está instalado en el equipo: lo ejecuta el CI del PR

## Despliegue (lo ejecuta `/release`)
- [ ] T095 Desplegar a staging y verificar criterios de aceptación
  - nota: no hay staging (`docs/deployment.md`); las verificaciones se hacen en local en T021 y T023
- [ ] T096 Aprobación humana para producción
- [ ] T097 Desplegar a producción y vigilar métricas del plan (Rollout): backend y frontend en el mismo `up -d --build`; un alta normal con la galería por debajo de 15; sin 503 de `/api/v1/imagenes` fuera de la prueba; si la galería llega a 15, `docker compose logs backend` muestra el 409 con su `request_id`
- [ ] T098 Marcar spec como `released`

## Cobertura
| Criterio | Tarea(s) de test | Tarea(s) de implementación |
|---|---|---|
| CA1 | T010 | T021 |
| CA2 | T010, T012, T013 | T002, T020, T021, T023, T033 |
| CA3 | T010, T012, T030, T031 | T021 |
| CA4 | T010, T013, T031 | T021, T023 |
| CA5 | T013 | T003, T022, T023 |
| CA6 | T013, T014, T032, T036 | T022, T023, T037 |
| CA7 | T011, T031, T034 | T020, T021, T035 |
| CA8 | T012 | T021 |
| CA9 | T013 | T023 |

| Amenaza (TM#) | Tarea(s) de control | Tarea(s) de test |
|---|---|---|
| TM1 | T020 | T011, T031 |
| TM2 | T021 | T012 |
| TM3 | T021 | T010 |
| TM4 | T020, T035 | T011, T031, T034 |
| TM5 | T021 | T012, T030 |
| TM6 | T021 | T010, T012, T030 |

| Cambio del plan (módulo) | Tarea(s) |
|---|---|
| `backend/src/modules/images/images.limites.js` | T002 |
| `backend/src/modules/images/images.repository.js` | T020, T033, T035 |
| `backend/src/modules/images/images.service.js` | T021 |
| `backend/src/modules/images/images.controller.js` | T021 |
| `docs/design/system.md`, `docs/design/system.html` | T001 |
| `frontend/src/utils/limitesGaleria.js` | T003 |
| `frontend/src/components/EncabezadoModulo.jsx` | T022 |
| `frontend/src/styles/adminpanel.css` | T022, T037 |
| `frontend/src/pages/admin/Admingaleria.jsx` | T023 |

| Requisito no funcional | Tarea(s) de test o verificación manual (T095) |
|---|---|
| WCAG 2.1 AA en contador, acción no disponible y aviso | T013, T014 · verificación manual en T023 (NVDA y teclado) |
| Mensajes en español y sin detalles internos | T012 |
| El límite lo aplica el servidor | T012 |
