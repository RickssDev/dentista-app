---
id: 029
slug: limite-galeria
status: released
released: v1.8.0 (2026-11-23)
created: 2026-11-23
extends: [014]
---

# 029 · Límite de 15 imágenes en la galería

## Problema
Hoy la galería admite cualquier cantidad de imágenes. La clínica quiere una galería acotada a 15
imágenes como máximo, contando las visibles y las ocultas, para mantenerla curada y controlar el
espacio que ocupa. Sin el límite, el personal puede seguir acumulando fotos sin revisar las
anteriores, y el personal no sabe cuántas hay ni cuántas le quedan.
Toca la subida de archivos y una acción administrativa, pero no atiende RS5 ni OB1, ni siquiera
parcialmente: sus correcciones quedan fuera (ver «Cobertura de riesgos»).

## Historias de usuario
- Como personal (Administrador o Asistente), quiero que la galería no pase de 15 imágenes para
  mantenerla ordenada y elegir cuáles se quedan.
- Como personal, quiero ver cuántas imágenes hay y cuántas admite la galería para saber si puedo
  agregar otra antes de intentarlo.
- Como personal, quiero poder seguir editando y reemplazando la foto de las imágenes existentes
  aunque la galería esté llena, para corregirlas sin tener que borrarlas.

## Criterios de aceptación
- [x] CA1 · Dada una galería con menos de 15 imágenes (visibles u ocultas), cuando el personal
  agrega una imagen válida, entonces se guarda como hoy (spec 014).
- [x] CA2 · Dada una galería con 15 imágenes, entre visibles y ocultas, cuando el personal intenta
  agregar otra, entonces se rechaza con el mensaje «La galería admite como máximo 15 imágenes.
  Elimina una para agregar otra.», la galería sigue con 15 y la foto enviada no queda guardada.
- [x] CA3 · Dada una galería con 15 imágenes, cuando el personal cambia el título o la visibilidad
  de una o reemplaza su foto, entonces el cambio se guarda y la galería sigue con 15. La foto de una
  imagen, al darla de alta o al editarla, solo puede ser un archivo subido en esa misma acción:
  nunca una ruta indicada por quien envía la petición.
- [x] CA4 · Dada una galería con 15 imágenes, cuando el personal elimina una, entonces puede
  volver a agregar una.
- [x] CA5 · Dado el panel de la galería, cuando el personal lo abre, entonces ve cuántas imágenes
  hay del máximo, con el texto «N de 15 imágenes», y el número se actualiza al agregar o eliminar
  sin recargar la página. Si la lista de imágenes no se pudo cargar, no se muestran el contador ni
  el aviso de CA6, y la acción de agregar queda como hoy (el límite lo sigue aplicando el servidor).
- [x] CA6 · Dada una galería con 15 imágenes, cuando el personal abre el panel, entonces la acción
  de agregar imagen aparece desactivada, se ve el aviso «Llegaste al máximo de 15 imágenes. Elimina
  una para agregar otra.» y un lector de pantalla anuncia que la acción no está disponible y por qué.
- [x] CA7 · (abuso) Dada una galería con 14 imágenes, cuando llegan dos altas al mismo tiempo
  (dos personas o dos pestañas), entonces se guarda solo una, la otra recibe el rechazo de CA2 y la
  galería nunca pasa de 15.
- [x] CA8 · (abuso) Dada una galería con 15 imágenes, cuando alguien envía el alta sin pasar por
  el panel (por ejemplo, desde otra herramienta con una sesión válida del personal), entonces se
  rechaza igual que en CA2.
- [x] CA9 · Dada una galería con 15 imágenes, cuando un visitante abre la página pública de la
  galería, entonces la ve igual que hoy: solo las visibles y sin ningún aviso del límite.

## Fuera de alcance
- Borrar, ocultar o elegir automáticamente imágenes cuando se llega al límite.
- Cambiar el límite desde el panel: 15 es fijo en esta spec.
- Límites para promociones, servicios o fotos de usuario.
- El tamaño máximo por imagen (sigue en 6 MB, spec 014 CA2).
- Álbumes, orden manual o paginación de la galería.

## Seguridad y privacidad
- Datos sensibles involucrados: ninguno. Las imágenes de la galería son públicas (clasificación
  «interna» en `docs/security.md`); el límite no cambia quién las ve.
- Quién puede hacer qué: sin cambios respecto a la spec 014. Administrador y Asistente agregan,
  editan y eliminan; los visitantes solo ven las visibles.
- Casos de abuso:
  - Como personal con dos pestañas abiertas, envío dos altas a la vez con 14 imágenes para pasar
    de 15 → se guarda una y la otra se rechaza (CA7).
  - Como usuario con sesión del personal, envío el alta sin pasar por el panel para saltarme el
    botón desactivado → se rechaza igual (CA8).

## Cobertura de riesgos
La spec no atiende ningún riesgo documentado. Toca dos zonas que tienen riesgos abiertos, y los
deja fuera (/analyze A6, A7):

| Corrección | Alcance | Criterios / motivo y destino |
|---|---|---|
| RS5.a — Validar el contenido real y una lista de extensiones permitidas | fuera | La spec no cambia qué tipo de archivo se acepta → sigue pendiente en `docs/security.md` |
| RS5.b — Servir `/uploads` con `nosniff` y sin contenido activo | fuera | La spec no cambia cómo se sirven los archivos → sigue pendiente en `docs/security.md` |
| OB1.a — Tabla de auditoría de solo anexado | fuera | Excepción P13 del usuario (2026-11-11) → objetivo 3 (specs 027 y 028) |
| OB1.b — Auditar logins y accesos denegados | fuera | No lo toca → objetivo 3 |
| OB1.c — Auditar lecturas de historial y datos de paciente | fuera | No lo toca → objetivo 3 |
| OB1.d — Auditar altas y cambios de pacientes e historial | fuera | No lo toca → objetivo 3 |
| OB1.e — Auditar acciones administrativas | fuera | El alta de imágenes es una acción administrativa; queda bajo la excepción P13 → objetivo 3 |
| OB1.f — Consulta de auditoría solo para el Administrador | fuera | No lo toca → objetivo 3 |

## Auditoría
Sin eventos nuevos en esta spec. El alta de imágenes es una acción administrativa, pero su registro
sigue cubierto por la excepción P13 aprobada por el usuario (2026-11-11) hasta el objetivo 3 del
roadmap (specs 027 y 028). La spec no toca datos sensibles, autenticación ni permisos.

## Diseño
Cambia solo el panel de la galería (`/admin/galeria`). El personal debe saber de un vistazo
cuántas imágenes hay y si puede agregar otra, sin descubrirlo al fallar. Sistema:
[docs/design/system.md](../../design/system.md). Acta de diseño: [design.md](design.md).

- Qué debe lograr: entender en cinco segundos «N de 15» y, si está llena, que debe eliminar una
  antes de agregar.
- Recursos de marca: los del sistema de diseño; no hay recursos nuevos.
- Qué debe diseñarse: el contador, el estado desactivado de la acción de agregar y el aviso de
  galería llena. La página pública de la galería no cambia.

## Criterios de diseño
Modo: operar · umbral 80 · mínimo por punto 3 · presupuesto 3 candidatos.

| ID | Qué se mide | Objetivo | Sale de |
|---|---|---|---|
| K1 | Contador «N de 15 imágenes» | Visible sin desplazarse a 390 y 1440 px | CA5 |
| K2 | Galería llena | Acción de agregar desactivada y aviso visibles a 390 y 1440 px; el aviso explica qué hacer | CA6 |
| K3 | Accesibilidad del estado lleno | El lector de pantalla anuncia la acción como no disponible y lee el aviso; contraste AA | CA6, constitución P16 |

Puertas: las de `design-spec/references/criterios.md` §2. Rúbrica: pesos por defecto.

## Requisitos no funcionales
- Accesibilidad WCAG 2.1 AA en el contador, la acción desactivada y el aviso (constitución P16).
- Los mensajes, en español y sin detalles internos.
- El límite lo aplica el servidor; el panel solo lo refleja (constitución P8).

## Preguntas abiertas
_(ninguna)_

## Decisiones
| Fecha | Tipo | Pregunta / conflicto | Decisión | Fuente |
|---|---|---|---|---|
| 2026-11-23 | brecha | ¿El límite cuenta solo las visibles o todas? | 15 en total, visibles y ocultas | usuario |
| 2026-11-23 | brecha | ¿Qué pasa si ya hay más de 15 al liberar? | Hoy hay menos de 15, así que no se da. Si llegara a pasar, se conservan todas y no se puede agregar hasta bajar de 15 | usuario |
| 2026-11-23 | brecha | ¿Qué ve el personal en el panel? | Contador «N de 15» y acción de agregar desactivada con aviso al llegar a 15 | usuario |
| 2026-11-23 | supuesto | ¿Reemplazar la foto de una imagen existente cuenta como alta? | No: editar y reemplazar se permiten con la galería llena | usuario (petición inicial) |
| 2026-11-23 | supuesto | ¿El límite aplica igual a Administrador y Asistente? | Sí, a los dos roles | spec 014 (mismos permisos) |
| 2026-11-23 | implícita | ¿Hace falta auditoría? | No en esta spec. El alta de imágenes es una acción administrativa que `docs/observability.md` manda auditar, pero sigue cubierta por la excepción P13 del usuario hasta el objetivo 3 (specs 027 y 028) | excepción P13 (decisión del usuario, 2026-11-11; `docs/specs/021-proteccion-cuentas-admin/plan.md`) · /analyze A6 |
| 2026-11-23 | brecha | ¿La foto de un alta rechazada se borra del disco en todos los rechazos o solo en el del límite? | En todo rechazo del alta (galería llena, galería ocupada y datos faltantes). Solo se borra el archivo subido en esa misma petición | usuario · /analyze A10 |
| 2026-11-23 | contradicción | La excepción P13 (acciones administrativas sin auditar hasta el objetivo 3) se aprobó en la spec 021, y la constitución manda auditar el alta de imágenes | La excepción se extiende a la galería en esta spec, hasta las specs 027 y 028 (OB1.e) | usuario · /analyze A22 |
| 2026-11-23 | brecha | Editar una imagen sin archivo acepta hoy una ruta escrita en la petición, que al eliminar la imagen borraría un archivo ajeno (defecto previo de la spec 014) | Se corrige aquí: al editar, como al dar de alta, la foto solo sale del archivo subido (CA3) | usuario · /analyze A17 |
| 2026-11-23 | brecha | ¿Qué muestra el panel si no puede cargar la lista? | Ni contador ni aviso; la acción de agregar queda como hoy | usuario · /analyze A16 |
| 2026-11-23 | supuesto | Texto del rechazo y del aviso | Los de CA2 y CA6; `/design-spec` puede ajustarlos sin cambiar su sentido | /specify |
| 2026-11-23 | diseño | ¿Cómo se ve el límite en el panel? | Sin diseño nuevo: contador bajo la descripción del encabezado, botón con `aria-disabled` y aviso informativo con variantes de marca existentes | [design.md](design.md) |

## Notas para /plan
- La foto se recibe antes de saber si hay sitio. Si el alta se rechaza por el límite, el archivo
  recibido no debe quedar en disco (CA2).
- CA7 exige que contar y guardar sean atómicos: no basta con contar antes de insertar.
- Una sola constante para el límite, compartida por backend y frontend, como ya se hace con los
  6 MB.
- Esta spec extiende la 014 (inferred) sin reemplazar ninguno de sus criterios: añade una regla
  nueva al alta.

## Historial
| Fecha | Cambio | Motivo |
|---|---|---|
| 2026-11-23 | Spec creada | Petición del usuario: tope de 15 imágenes en la galería |
| 2026-11-23 | Spec aprobada | Confirmación del usuario |
| 2026-11-23 | CA5 con el caso de lista sin cargar; Decisiones de auditoría, borrado en rechazos y carga fallida | /analyze A6, A10, A16 (decisiones del usuario) |
| 2026-11-23 | CA3: la foto solo sale de un archivo subido; Decisiones de la excepción P13 y de la edición | /analyze A17, A22 (decisiones del usuario) |
| 2026-11-23 | Implementada (12 de 12 tareas) | /implement |
| 2026-11-23 | Vuelve a `approved`: /review ronda 1 pide T030–T037 | /review (changes_requested) |
| 2026-11-23 | Implementada de nuevo con T030–T037 (review ronda 1) | /implement |
| 2026-11-23 | Liberada en v1.8.0 | /release |
