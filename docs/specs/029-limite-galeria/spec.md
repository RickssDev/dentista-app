---
id: 029
slug: limite-galeria
status: approved
created: 2026-11-23
extends: [014]
---

# 029 · Límite de 15 imágenes en la galería

## Problema
Hoy la galería admite cualquier cantidad de imágenes. La clínica quiere una galería acotada a 15
imágenes como máximo, contando las visibles y las ocultas, para mantenerla curada y controlar el
espacio que ocupa. Sin el límite, el personal puede seguir acumulando fotos sin revisar las
anteriores, y el personal no sabe cuántas hay ni cuántas le quedan.

## Historias de usuario
- Como personal (Administrador o Asistente), quiero que la galería no pase de 15 imágenes para
  mantenerla ordenada y elegir cuáles se quedan.
- Como personal, quiero ver cuántas imágenes hay y cuántas admite la galería para saber si puedo
  agregar otra antes de intentarlo.
- Como personal, quiero poder seguir editando y reemplazando la foto de las imágenes existentes
  aunque la galería esté llena, para corregirlas sin tener que borrarlas.

## Criterios de aceptación
- [ ] CA1 · Dada una galería con menos de 15 imágenes (visibles u ocultas), cuando el personal
  agrega una imagen válida, entonces se guarda como hoy (spec 014).
- [ ] CA2 · Dada una galería con 15 imágenes, entre visibles y ocultas, cuando el personal intenta
  agregar otra, entonces se rechaza con el mensaje «La galería admite como máximo 15 imágenes.
  Elimina una para agregar otra.», la galería sigue con 15 y la foto enviada no queda guardada.
- [ ] CA3 · Dada una galería con 15 imágenes, cuando el personal cambia el título o la visibilidad
  de una o reemplaza su foto, entonces el cambio se guarda y la galería sigue con 15.
- [ ] CA4 · Dada una galería con 15 imágenes, cuando el personal elimina una, entonces puede
  volver a agregar una.
- [ ] CA5 · Dado el panel de la galería, cuando el personal lo abre, entonces ve cuántas imágenes
  hay del máximo, con el texto «N de 15 imágenes», y el número se actualiza al agregar o eliminar
  sin recargar la página.
- [ ] CA6 · Dada una galería con 15 imágenes, cuando el personal abre el panel, entonces la acción
  de agregar imagen aparece desactivada, se ve el aviso «Llegaste al máximo de 15 imágenes. Elimina
  una para agregar otra.» y un lector de pantalla anuncia que la acción no está disponible y por qué.
- [ ] CA7 · (abuso) Dada una galería con 14 imágenes, cuando llegan dos altas al mismo tiempo
  (dos personas o dos pestañas), entonces se guarda solo una, la otra recibe el rechazo de CA2 y la
  galería nunca pasa de 15.
- [ ] CA8 · (abuso) Dada una galería con 15 imágenes, cuando alguien envía el alta sin pasar por
  el panel (por ejemplo, desde otra herramienta con una sesión válida del personal), entonces se
  rechaza igual que en CA2.
- [ ] CA9 · Dada una galería con 15 imágenes, cuando un visitante abre la página pública de la
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

## Auditoría
No aplica: la spec no toca datos sensibles, autenticación ni permisos. Solo añade un límite de
cantidad a una acción que el personal ya tiene permitida, y la galería es contenido público.

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
| 2026-11-23 | implícita | ¿Hace falta auditoría? | No: no toca datos sensibles, autenticación ni permisos | `docs/observability.md`, `docs/security.md` |
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
